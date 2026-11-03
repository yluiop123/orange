package com.orange.security.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.io.Resource;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        long accessExpire,
        long refreshExpire,
        Resource privateKey,
        Resource publicKey) {
}
