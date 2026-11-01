package com.orange.security;

import java.time.Instant;

/**
 * 解析后的 JWT 内容，避免把 JJWT 的 Claims 暴露到安全过滤器之外。
 */
public record JwtClaims(
        String tokenId,
        String type,
        String username,
        String subject,
        Integer version,
        Instant issuedAt,
        Instant expiresAt) {

    public String effectiveUsername() {
        return username != null ? username : subject;
    }
}
