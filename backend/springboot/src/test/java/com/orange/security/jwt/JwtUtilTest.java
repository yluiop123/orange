package com.orange.security.jwt;

import com.orange.security.config.JwtProperties;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private KeyPair keyPair;
    private AuthUser user;

    @BeforeEach
    void setUp() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keyPair = generator.generateKeyPair();
        jwtUtil = new JwtUtil(keyPair.getPrivate(), keyPair.getPublic(),
                new JwtProperties(300, 600, "orange", null, null));
        user = new AuthUser(
                "user-id",
                "alice",
                "password",
                true,
                List.of(new SimpleGrantedAuthority("menu#/dashboard")),
                3,
                false);
    }

    @Test
    void accessTokenRoundTrip() {
        String token = jwtUtil.generateJwtToken(user);

        JwtClaims claims = jwtUtil.parseAccessToken(token);

        assertEquals("access", claims.type());
        assertEquals("alice", claims.effectiveUsername());
        assertEquals("user-id", claims.subject());
        assertEquals(3, claims.version());
        assertTrue(jwtUtil.isAccessTokenValid(claims, user));
    }

    @Test
    void refreshTokenIsNotAcceptedAsAccessToken() {
        String token = jwtUtil.generateRefreshToken(user);

        assertThrows(IllegalArgumentException.class, () -> jwtUtil.parseAccessToken(token));

        JwtClaims claims = jwtUtil.parseRefreshToken(token);
        assertTrue(jwtUtil.isRefreshTokenValid(claims, user));
    }

    @Test
    void tokenVersionMismatchIsRejected() {
        String token = jwtUtil.generateJwtToken(user);
        AuthUser changed = new AuthUser(
                "user-id", "alice", "password", true, List.of(), 4, false);

        JwtClaims claims = jwtUtil.parseAccessToken(token);

        assertFalse(jwtUtil.isAccessTokenValid(claims, changed));
    }

    @Test
    void disabledUserIsRejected() {
        String token = jwtUtil.generateJwtToken(user);
        AuthUser disabled = new AuthUser(
                "user-id", "alice", "password", false, List.of(), 3, false);

        JwtClaims claims = jwtUtil.parseAccessToken(token);

        assertFalse(jwtUtil.isAccessTokenValid(claims, disabled));
    }

    @Test
    void expiredTokenIsRejectedWhenParsed() {
        JwtUtil shortLived = new JwtUtil(keyPair.getPrivate(), keyPair.getPublic(),
                new JwtProperties(-60, 600, "orange", null, null));
        String token = shortLived.generateJwtToken(user);

        assertThrows(JwtException.class, () -> shortLived.parseAccessToken(token));
    }

    @Test
    void legacyTokenWithoutUsernameClaimIsAccepted() {
        Date issuedAt = new Date();
        String token = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .claim("typ", "access")
                .claim("ver", 3)
                .subject("alice")
                .issuer("orange")
                .issuedAt(issuedAt)
                .expiration(Date.from(Instant.ofEpochMilli(issuedAt.getTime()).plusSeconds(60)))
                .signWith(keyPair.getPrivate(), Jwts.SIG.RS256)
                .compact();

        JwtClaims claims = jwtUtil.parseAccessToken(token);

        assertNull(claims.username());
        assertEquals("alice", claims.effectiveUsername());
        assertTrue(jwtUtil.isAccessTokenValid(claims, user));
    }
}
