package com.orange.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.UUID;

/**
 * JwtRequestFilter 是用于JWT身份验证的过滤器。
 * 它继承了 OncePerRequestFilter 类，确保过滤器每个请求只应用一次。
 */

@Component
@Slf4j
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    /**
     * 对每个传入的请求调用此方法，执行JWT身份验证过程。
     *
     * @param request       表示传入请求的 HttpServletRequest 对象。
     * @param response      表示要发送的 HttpServletResponse 对象。
     * @param filterChain   用于调用链中的下一个过滤器的 FilterChain 对象。
     * @throws ServletException     处理请求时发生异常。
     * @throws IOException          发生I/O异常。
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,FilterChain filterChain) throws ServletException, IOException {
        String tokenHeader = request.getHeader("Authorization");
        String username = null;
        String token = null;
        // if bearer token is provided, get the username
        if (tokenHeader != null && tokenHeader.startsWith("Bearer ")) {
            token = tokenHeader.substring(7);
            try {
                username = jwtUtil.getUsernameFromToken(token);
            } catch (Exception e) {
                logger.warn("JWT Token validation failed: " + e.getMessage());
                // 不要在这里 throw 异常，否则 permitAll 的接口也进不去
            }
        }
        // validate the JWT Token and create a new authentication token and set in security context
        if (null != username && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (jwtUtil.validateJwtToken(token, userDetails)) {
                String path = request.getRequestURI();
                boolean allowedBeforePasswordChange =
                        path.equals("/api/user/change-password")
                                || path.equals("/api/user/userInfo")
                                || path.equals("/api/user/menus")
                                || path.equals("/api/user/logout");
                if (userDetails instanceof AuthUser authUser
                        && authUser.isMustChangePassword()
                        && !allowedBeforePasswordChange) {
                    writeMustChangePassword(response);
                    return;
                }
                UsernamePasswordAuthenticationToken
                        authenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authenticationToken.setDetails(new
                        WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }
        }
        filterChain.doFilter(request, response);
    }

    private void writeMustChangePassword(HttpServletResponse response) throws IOException {
        String body = "{\"code\":40302,\"message\":\"请先修改初始密码\",\"data\":null,"
                + "\"timestamp\":" + System.currentTimeMillis()
                + ",\"traceId\":\"" + UUID.randomUUID().toString().replace("-", "") + "\"}";
        byte[] bytes = body.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.setContentLength(bytes.length);
        response.getOutputStream().write(bytes);
        response.flushBuffer();
    }
}
