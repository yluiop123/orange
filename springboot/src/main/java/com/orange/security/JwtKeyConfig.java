package com.orange.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Configuration
public class JwtKeyConfig {

    private static final String RSA_ALGORITHM = "RSA";
    private static final String PRIVATE_KEY_TYPE = "PRIVATE KEY";
    private static final String PUBLIC_KEY_TYPE = "PUBLIC KEY";

    private final Resource privateKeyResource;
    private final Resource publicKeyResource;

    public JwtKeyConfig(@Value("${jwt.private-key}") Resource privateKeyResource,
                        @Value("${jwt.public-key}") Resource publicKeyResource) {
        this.privateKeyResource = privateKeyResource;
        this.publicKeyResource = publicKeyResource;
    }

    @Bean
    public PrivateKey privateKey() throws GeneralSecurityException, IOException {
        byte[] decoded = decodeKey(privateKeyResource, PRIVATE_KEY_TYPE);
        return KeyFactory.getInstance(RSA_ALGORITHM)
                .generatePrivate(new PKCS8EncodedKeySpec(decoded));
    }

    @Bean
    public PublicKey publicKey() throws GeneralSecurityException, IOException {
        byte[] decoded = decodeKey(publicKeyResource, PUBLIC_KEY_TYPE);
        return KeyFactory.getInstance(RSA_ALGORITHM)
                .generatePublic(new X509EncodedKeySpec(decoded));
    }

    private byte[] decodeKey(Resource resource, String keyType) throws IOException {
        String key = readKey(resource)
                .replace("-----BEGIN " + keyType + "-----", "")
                .replace("-----END " + keyType + "-----", "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(key);
    }

    private String readKey(Resource resource) throws IOException {
        try (InputStream inputStream = resource.getInputStream()) {
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
