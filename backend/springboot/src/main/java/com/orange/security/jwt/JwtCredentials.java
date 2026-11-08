package com.orange.security.jwt;

import javax.crypto.SecretKey;
import java.security.PrivateKey;
import java.security.PublicKey;

/**
 * Signing material shared by all six backends: an RSA key pair (RS256) or an
 * HMAC secret (HS256). Exactly one side is set.
 */
public record JwtCredentials(PrivateKey privateKey, PublicKey publicKey, SecretKey secretKey) {

    public static JwtCredentials rsa(PrivateKey privateKey, PublicKey publicKey) {
        return new JwtCredentials(privateKey, publicKey, null);
    }

    public static JwtCredentials hmac(SecretKey secretKey) {
        return new JwtCredentials(null, null, secretKey);
    }

    public boolean rsa() {
        return privateKey != null;
    }
}
