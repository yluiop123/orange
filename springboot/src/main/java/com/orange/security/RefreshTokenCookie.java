package com.orange.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * refresh token 统一使用 HttpOnly Cookie 下发，前端 JS 不读取。
 */
@Component
public class RefreshTokenCookie {

    public static final String NAME = "refresh_token";

    @Value("${app.auth.cookie-secure:false}")
    private boolean secure;

    @Value("${app.auth.cookie-same-site:Lax}")
    private String sameSite;

    @Value("${app.auth.cookie-domain:}")
    private String domain;

    @Value("${jwt.refresh-expire}")
    private long refreshExpire;

    public ResponseCookie create(String token) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(NAME, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/api/user")
                .maxAge(Duration.ofSeconds(refreshExpire));
        if (domain != null && !domain.isBlank()) {
            builder.domain(domain);
        }
        return builder.build();
    }

    public ResponseCookie clear() {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(NAME, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/api/user")
                .maxAge(Duration.ZERO);
        if (domain != null && !domain.isBlank()) {
            builder.domain(domain);
        }
        return builder.build();
    }
}
