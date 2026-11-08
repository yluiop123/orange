package com.orange.security.jwt;

import com.orange.security.config.JwtProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.core.io.ClassPathResource;

import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * Resolves JWT signing material with the same rule as the other five stacks:
 * a complete RSA pair selects RS256, otherwise `JWT_SECRET` selects HS256.
 */
@Slf4j
@Configuration
public class JwtKeyConfig {

    private static final String RSA_ALGORITHM = "RSA";
    private static final String PRIVATE_KEY_TYPE = "PRIVATE KEY";
    private static final String PUBLIC_KEY_TYPE = "PUBLIC KEY";
    private static final String DEV_JWT_SECRET = "orange-dev-secret-change-me-in-production";
    private static final int MIN_HMAC_BYTES = 32;

    private final JwtProperties properties;
    private final Environment environment;

    public JwtKeyConfig(JwtProperties properties, Environment environment) {
        this.properties = properties;
        this.environment = environment;
    }

    @Bean
    public JwtCredentials jwtCredentials() throws GeneralSecurityException, IOException {
        String privateMaterial = readKeyMaterial(properties.privateKey(), "private key");
        String publicMaterial = readKeyMaterial(properties.publicKey(), "public key");

        if ((privateMaterial == null) != (publicMaterial == null)) {
            throw new IllegalStateException(
                    "JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set together (inline PEM or a path)");
        }

        if (privateMaterial != null) {
            JwtCredentials credentials = JwtCredentials.rsa(
                    loadPrivateKey(privateMaterial), loadPublicKey(publicMaterial));
            log.info("JWT signing: RS256 (RSA key pair)");
            return credentials;
        }

        String secret = environment.getProperty("JWT_SECRET");
        if (secret == null || secret.isBlank()) {
            secret = DEV_JWT_SECRET;
        }
        if (isProduction() && DEV_JWT_SECRET.equals(secret)) {
            throw new IllegalStateException(
                    "Set JWT_PRIVATE_KEY/JWT_PUBLIC_KEY (recommended) or a non-default JWT_SECRET in production");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < MIN_HMAC_BYTES) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes");
        }
        log.info("JWT signing: HS256 (JWT_SECRET)");
        return JwtCredentials.hmac(new SecretKeySpec(bytes, "HmacSHA256"));
    }

    private boolean isProduction() {
        String appEnv = environment.getProperty("APP_ENV", "local").toLowerCase();
        return "production".equals(appEnv)
                || "prod".equals(appEnv)
                || environment.acceptsProfiles(Profiles.of("prod"));
    }

    /**
     * Accepts inline PEM or a path (`classpath:...`, `file:...` or a plain
     * filesystem path), matching the rule documented for every backend.
     */
    private String readKeyMaterial(String value, String label) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String material = value.trim();
        if (material.contains("-----BEGIN")) {
            return material;
        }
        try {
            if (material.startsWith("classpath:")) {
                return new ClassPathResource(material.substring("classpath:".length()))
                        .getContentAsString(StandardCharsets.UTF_8);
            }
            String path = material.startsWith("file:")
                    ? material.substring("file:".length())
                    : material;
            return Files.readString(Path.of(path), StandardCharsets.UTF_8);
        } catch (IOException error) {
            throw new IllegalStateException(
                    "Cannot read the JWT " + label + " from " + value, error);
        }
    }

    private PrivateKey loadPrivateKey(String pem) throws GeneralSecurityException {
        byte[] decoded = decodeKey(pem, PRIVATE_KEY_TYPE);
        return KeyFactory.getInstance(RSA_ALGORITHM)
                .generatePrivate(new PKCS8EncodedKeySpec(decoded));
    }

    private PublicKey loadPublicKey(String pem) throws GeneralSecurityException {
        byte[] decoded = decodeKey(pem, PUBLIC_KEY_TYPE);
        return KeyFactory.getInstance(RSA_ALGORITHM)
                .generatePublic(new X509EncodedKeySpec(decoded));
    }

    private byte[] decodeKey(String pem, String keyType) {
        String key = pem
                .replace("-----BEGIN " + keyType + "-----", "")
                .replace("-----END " + keyType + "-----", "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(key);
    }
}
