package com.orange.controller.login;

import com.orange.domain.common.ErrorCode;
import com.orange.domain.common.Response;
import com.orange.domain.login.req.LoginReq;
import com.orange.domain.login.req.ChangePasswordReq;
import com.orange.domain.login.resp.LoginResp;
import com.orange.domain.login.resp.UserInfo;
import com.orange.security.JwtClaims;
import com.orange.security.JwtUtil;
import com.orange.security.LoginAttemptService;
import com.orange.security.TokenBlacklistService;
import com.orange.security.RefreshTokenCookie;
import com.orange.service.system.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@Slf4j
@RestController
@RequestMapping("/api/user")
public class LoginController {
    @Autowired
    private UserDetailsService userDetailsService;
    @Autowired
    private UserService userService;
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private RefreshTokenCookie refreshTokenCookie;
    @Autowired
    private LoginAttemptService loginAttemptService;
    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @PostMapping("/login")
    public ResponseEntity<Response<LoginResp>> login(@Valid @RequestBody LoginReq req,
                                                     HttpServletRequest request,
                                                     HttpServletResponse response) {
        String ip = request.getRemoteAddr();
        if (loginAttemptService.isBlocked(ip, req.getUsername())) {
            return rateLimited();
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
        } catch (UsernameNotFoundException | BadCredentialsException e) {
            loginAttemptService.onFailure(ip, req.getUsername());
            // 不区分用户名不存在和密码错误，避免用户名枚举
            return unauthorized(response, "用户名或密码错误");
        } catch (AuthenticationException e) {
            loginAttemptService.onFailure(ip, req.getUsername());
            return unauthorized(response, "用户名或密码错误");
        } catch (Exception e) {
            log.error("login failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Response.<LoginResp>error(
                            ErrorCode.SYSTEM_ERROR.getCode(), "登录失败，请稍后重试"));
        }

        loginAttemptService.onSuccess(ip, req.getUsername());
        final UserDetails userDetails = userDetailsService.loadUserByUsername(req.getUsername());
        final String jwtToken = jwtUtil.generateJwtToken(userDetails);
        final String refreshToken = jwtUtil.generateRefreshToken(userDetails);
        // refresh token 只通过 HttpOnly Cookie 下发，前端 JS 不读取
        response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.create(refreshToken).toString());
        return ResponseEntity.ok(Response.ok(new LoginResp(jwtToken, "ok", null, null,
                jwtUtil.getAccessExpireSeconds(), jwtUtil.getRefreshExpireSeconds())));
    }

    /**
     * 用 refresh Cookie 换取新的 access token。
     * 失败统一返回 HTTP 401，前端据此清理会话并跳转登录。
     */
    @PostMapping("/refresh")
    public ResponseEntity<Response<LoginResp>> refresh(
            @CookieValue(name = RefreshTokenCookie.NAME, required = false) String refreshToken,
            HttpServletResponse response) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return unauthorized(response, "未登录");
        }
        try {
            JwtClaims claims = jwtUtil.parseRefreshToken(refreshToken);
            String jti = claims.tokenId();
            if (tokenBlacklistService.isRevoked(jti)) {
                return unauthorized(response, "登录已过期");
            }
            UserDetails userDetails = userDetailsService.loadUserByUsername(claims.effectiveUsername());
            if (!jwtUtil.isRefreshTokenValid(claims, userDetails)) {
                return unauthorized(response, "登录已过期");
            }
            // 轮换 refresh token：旧 jti 立即吊销，避免重放
            tokenBlacklistService.revoke(jti, "refresh", claims.expiresAt());
            String accessToken = jwtUtil.generateJwtToken(userDetails);
            String newRefreshToken = jwtUtil.generateRefreshToken(userDetails);
            response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.create(newRefreshToken).toString());
            return ResponseEntity.ok(Response.ok(new LoginResp(accessToken, "ok", null, null,
                    jwtUtil.getAccessExpireSeconds(), jwtUtil.getRefreshExpireSeconds())));
        } catch (Exception e) {
            return unauthorized(response, "登录已过期");
        }
    }

    @PostMapping("/logout")
    public Response<String> logout(
            @CookieValue(name = RefreshTokenCookie.NAME, required = false) String refreshToken,
            Principal principal,
            HttpServletResponse response) {
        String username = null;
        if (refreshToken != null && !refreshToken.isBlank()) {
            try {
                JwtClaims claims = jwtUtil.parseRefreshToken(refreshToken);
                username = claims.effectiveUsername();
                tokenBlacklistService.revoke(claims.tokenId(), "refresh", claims.expiresAt());
            } catch (Exception e) {
                log.debug("logout with invalid refresh token: {}", e.getMessage());
            }
        }
        // Cookie 不可用时，退回到当前 access token 对应的用户
        if (username == null && principal != null) {
            username = principal.getName();
        }
        if (username != null) {
            // 递增 token 版本，使该用户所有旧 access/refresh token 失效
            userService.revokeTokens(username);
        }
        response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.clear().toString());
        return Response.ok("ok");
    }

    private ResponseEntity<Response<LoginResp>> unauthorized(HttpServletResponse response, String message) {
        // 失败的 refresh 也清掉旧 Cookie，避免反复带着无效凭证请求
        response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.clear().toString());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Response.<LoginResp>error(ErrorCode.UNAUTHORIZED.getCode(), message));
    }

    private ResponseEntity<Response<LoginResp>> rateLimited() {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Response.<LoginResp>error(429, "登录失败次数过多，请稍后再试"));
    }

    @GetMapping("/userInfo")
    public Response<UserInfo> userInfo(Principal principal) {
        String username = principal.getName();
        UserInfo userInfo = userService.queryUserInfo(username);
        return Response.ok(userInfo);
    }

    @PostMapping("/change-password")
    public Response<String> changePassword(@Valid @RequestBody ChangePasswordReq req,
                                           Principal principal,
                                           HttpServletResponse response) {
        userService.changePassword(principal.getName(), req.getOldPassword(), req.getNewPassword());
        // 密码修改后旧 token 已失效，同时清掉 refresh Cookie
        response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.clear().toString());
        return Response.ok("密码已修改，请重新登录");
    }
}
