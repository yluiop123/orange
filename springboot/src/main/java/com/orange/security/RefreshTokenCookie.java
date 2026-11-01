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
    private static final String COOKIE_PATH = "/api/user";

    private final boolean secure;
    private final String sameSite;
    private final String domain;
    private final long refreshExpire;

    public RefreshTokenCookie(@Value("${app.auth.cookie-secure:false}") boolean secure,
                              @Value("${app.auth.cookie-same-site:Lax}") String sameSite,
                              @Value("${app.auth.cookie-domain:}") String domain,
                              @Value("${jwt.refresh-expire}") long refreshExpire) {
        this.secure = secure;
        this.sameSite = sameSite;
        this.domain = domain;
        this.refreshExpire = refreshExpire;
    }

    public ResponseCookie create(String token) {
        return build(token, Duration.ofSeconds(refreshExpire));
    }

    public ResponseCookie clear() {
        return build("", Duration.ZERO);
    }

    private ResponseCookie build(String token, Duration maxAge) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(NAME, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path(COOKIE_PATH)
                .maxAge(maxAge);
        if (domain != null && !domain.isBlank()) {
            builder.domain(domain);
        }
        return builder.build();
    }
}
