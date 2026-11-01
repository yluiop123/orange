package com.orange.security.jwt;

import com.orange.security.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    private static final String TOKEN_TYPE_ACCESS = "access";
    private static final String TOKEN_TYPE_REFRESH = "refresh";
    private static final String CLAIM_TYPE = "typ";
    private static final String CLAIM_VERSION = "ver";
    private static final String CLAIM_USERNAME = "username";

    private final PrivateKey privateKey;
    private final PublicKey publicKey;
    private final long accessExpire;
    private final long refreshExpire;

    public JwtUtil(PrivateKey privateKey,
                   PublicKey publicKey,
                   JwtProperties properties) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.accessExpire = properties.accessExpire();
        this.refreshExpire = properties.refreshExpire();
    }

    public String generateJwtToken(UserDetails userDetails) {
        return buildToken(userDetails, TOKEN_TYPE_ACCESS, accessExpire);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return buildToken(userDetails, TOKEN_TYPE_REFRESH, refreshExpire);
    }

    public JwtClaims parseAccessToken(String token) {
        return requireType(parseToken(token), TOKEN_TYPE_ACCESS);
    }

    public JwtClaims parseRefreshToken(String token) {
        return requireType(parseToken(token), TOKEN_TYPE_REFRESH);
    }

    public boolean isAccessTokenValid(JwtClaims claims, UserDetails userDetails) {
        return TOKEN_TYPE_ACCESS.equals(claims.type()) && isTokenValid(claims, userDetails);
    }

    public boolean isRefreshTokenValid(JwtClaims claims, UserDetails userDetails) {
        return TOKEN_TYPE_REFRESH.equals(claims.type()) && isTokenValid(claims, userDetails);
    }

    public long getAccessExpireSeconds() {
        return accessExpire;
    }

    public long getRefreshExpireSeconds() {
        return refreshExpire;
    }

    private String buildToken(UserDetails userDetails, String type, long expireSeconds) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusSeconds(expireSeconds);
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .claim(CLAIM_TYPE, type)
                .claim(CLAIM_VERSION, tokenVersion(userDetails))
                .claim(CLAIM_USERNAME, userDetails.getUsername())
                .subject(subject(userDetails))
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    private JwtClaims parseToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(publicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Number version = claims.get(CLAIM_VERSION, Number.class);
        return new JwtClaims(
                claims.getId(),
                claims.get(CLAIM_TYPE, String.class),
                claims.get(CLAIM_USERNAME, String.class),
                claims.getSubject(),
                version == null ? null : version.intValue(),
                toInstant(claims.getIssuedAt()),
                toInstant(claims.getExpiration()));
    }

    private JwtClaims requireType(JwtClaims claims, String expectedType) {
        if (!expectedType.equals(claims.type())) {
            throw new IllegalArgumentException("not a " + expectedType + " token");
        }
        return claims;
    }

    private boolean isTokenValid(JwtClaims claims, UserDetails userDetails) {
        if (!userDetails.isEnabled()) {
            return false;
        }
        if (claims.version() == null || claims.version() != tokenVersion(userDetails)) {
            return false;
        }
        if (isExpired(claims)) {
            return false;
        }
        return userDetails.getUsername().equals(claims.effectiveUsername())
                && subjectMatches(claims, userDetails);
    }

    private boolean isExpired(JwtClaims claims) {
        return claims.expiresAt() == null || !claims.expiresAt().isAfter(Instant.now());
    }

    /**
     * 兼容升级前 subject 为 username、没有 username claim 的旧 token。
     */
    private boolean subjectMatches(JwtClaims claims, UserDetails userDetails) {
        if (claims.username() == null) {
            return userDetails.getUsername().equals(claims.subject());
        }
        if (userDetails instanceof AuthUser authUser && authUser.getUserId() != null) {
            return authUser.getUserId().equals(claims.subject());
        }
        return userDetails.getUsername().equals(claims.subject());
    }

    private String subject(UserDetails userDetails) {
        return userDetails instanceof AuthUser authUser
                ? authUser.getUserId()
                : userDetails.getUsername();
    }

    private int tokenVersion(UserDetails userDetails) {
        return userDetails instanceof AuthUser authUser ? authUser.getTokenVersion() : 0;
    }

    private Instant toInstant(Date date) {
        return date == null ? null : date.toInstant();
    }
}
