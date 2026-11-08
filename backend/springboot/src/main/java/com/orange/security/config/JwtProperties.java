package com.orange.security.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        long accessExpire,
        long refreshExpire,
        String issuer,
        /**
         * RSA private key: inline PEM or a path. When both this and
         * {@link #publicKey()} are set the stack signs with RS256.
         */
        String privateKey,
        /** RSA public key: inline PEM or a path. */
        String publicKey) {
}
