package com.orange.security;

import com.orange.domain.common.ErrorCode;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * 每个请求只解析一次 access token，再加载用户并校验版本、主体和过期时间。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtRequestFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final Set<String> ALLOWED_BEFORE_PASSWORD_CHANGE = Set.of(
            "/api/user/change-password",
            "/api/user/userInfo",
            "/api/user/menus",
            "/api/user/logout");

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final SecurityResponseWriter responseWriter;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                JwtClaims claims = jwtUtil.parseAccessToken(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(claims.effectiveUsername());
                if (jwtUtil.isAccessTokenValid(claims, userDetails)) {
                    if (mustChangePassword(userDetails, request)) {
                        responseWriter.write(response, ErrorCode.PASSWORD_CHANGE_REQUIRED);
                        return;
                    }
                    authenticate(request, userDetails);
                }
            } catch (JwtException | IllegalArgumentException | UsernameNotFoundException e) {
                log.warn("JWT authentication failed: {}", e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            return null;
        }
        return header.substring(BEARER_PREFIX.length());
    }

    private boolean mustChangePassword(UserDetails userDetails, HttpServletRequest request) {
        return userDetails instanceof AuthUser authUser
                && authUser.isMustChangePassword()
                && !ALLOWED_BEFORE_PASSWORD_CHANGE.contains(request.getRequestURI());
    }

    private void authenticate(HttpServletRequest request, UserDetails userDetails) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
