package com.orange.security.jwt;

import com.orange.security.config.JwtProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Slf4j
@Configuration
public class JwtKeyConfig {

    private static final String RSA_ALGORITHM = "RSA";
    private static final String PRIVATE_KEY_TYPE = "PRIVATE KEY";
    private static final String PUBLIC_KEY_TYPE = "PUBLIC KEY";
    private static final int RSA_KEY_SIZE = 2048;

    private final JwtProperties properties;
    private final Environment environment;

    public JwtKeyConfig(JwtProperties properties, Environment environment) {
        this.properties = properties;
        this.environment = environment;
    }

    /**
     * 优先加载配置的 PEM；本地演示或 CI 没有密钥时生成临时密钥对。
     * 临时密钥只适合开发/演示，重启后旧 token 会失效；生产必须挂载固定密钥。
     */
    @Bean
    public KeyPair jwtKeyPair() throws GeneralSecurityException, IOException {
        if (resourceExists(properties.privateKey()) && resourceExists(properties.publicKey())) {
            return new KeyPair(loadPublicKey(), loadPrivateKey());
        }
        if (isProduction()) {
            throw new IllegalStateException(
                    "JWT key files are missing in production; configure jwt.private-key and jwt.public-key");
        }
        log.warn("JWT key files are missing; generating an ephemeral RSA key pair. "
                + "Old tokens will be invalid after restart. Configure jwt.private-key and jwt.public-key in production.");
        KeyPairGenerator generator = KeyPairGenerator.getInstance(RSA_ALGORITHM);
        generator.initialize(RSA_KEY_SIZE);
        return generator.generateKeyPair();
    }

    @Bean
    public PrivateKey privateKey(KeyPair keyPair) {
        return keyPair.getPrivate();
    }

    @Bean
    public PublicKey publicKey(KeyPair keyPair) {
        return keyPair.getPublic();
    }

    private PrivateKey loadPrivateKey() throws GeneralSecurityException, IOException {
        byte[] decoded = decodeKey(properties.privateKey(), PRIVATE_KEY_TYPE);
        return KeyFactory.getInstance(RSA_ALGORITHM)
                .generatePrivate(new PKCS8EncodedKeySpec(decoded));
    }

    private PublicKey loadPublicKey() throws GeneralSecurityException, IOException {
        byte[] decoded = decodeKey(properties.publicKey(), PUBLIC_KEY_TYPE);
        return KeyFactory.getInstance(RSA_ALGORITHM)
                .generatePublic(new X509EncodedKeySpec(decoded));
    }

    private boolean isProduction() {
        String appEnv = environment.getProperty("APP_ENV", "local").toLowerCase();
        return "production".equals(appEnv)
                || "prod".equals(appEnv)
                || environment.acceptsProfiles(Profiles.of("prod"));
    }

    private boolean resourceExists(Resource resource) {
        return resource != null && resource.exists();
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
