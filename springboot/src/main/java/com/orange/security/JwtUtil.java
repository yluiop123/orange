package com.orange.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.*;
import java.util.*;

@Component
@RequiredArgsConstructor
public class JwtUtil {

    @Autowired
    private PrivateKey privateKey;

    @Autowired
    private PublicKey publicKey;

    @Value("${jwt.access-expire}")
    private long accessExpire;

    @Value("${jwt.refresh-expire}")
    private long refreshExpire;

    public String generateJwtToken(UserDetails userDetails) {
        return buildToken(userDetails, "access", accessExpire);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return buildToken(userDetails, "refresh", refreshExpire);
    }

    private String buildToken(UserDetails userDetails, String type, long expireSeconds) {
        Date issuedAt = new Date();
        Date expiration = new Date(issuedAt.getTime() + expireSeconds * 1000);
        String subject = userDetails instanceof AuthUser authUser
                ? authUser.getUserId()
                : userDetails.getUsername();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .claim("typ", type)
                .claim("ver", tokenVersion(userDetails))
                .claim("username", userDetails.getUsername())
                .subject(subject)
                .issuedAt(issuedAt)
                .expiration(expiration)
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    public Boolean validateJwtToken(String token, UserDetails userDetails) {
        final Claims claims = parse(token);
        if (!"access".equals(claims.get("typ"))) {
            return false;
        }
        if (!userDetails.isEnabled()) {
            return false;
        }
        Number version = claims.get("ver", Number.class);
        if (version == null || version.intValue() != tokenVersion(userDetails)) {
            return false;
        }
        String username = username(claims);
        boolean isTokenExpired = claims.getExpiration().before(new Date());
        boolean subjectMatches = subjectMatches(claims, userDetails);
        return subjectMatches && username.equals(userDetails.getUsername()) && !isTokenExpired;
    }

    public boolean validateRefreshToken(String token, UserDetails userDetails) {
        final Claims claims = parse(token);
        if (!"refresh".equals(claims.get("typ"))) {
            return false;
        }
        if (!userDetails.isEnabled()) {
            return false;
        }
        Number version = claims.get("ver", Number.class);
        if (version == null || version.intValue() != tokenVersion(userDetails)) {
            return false;
        }
        return subjectMatches(claims, userDetails)
                && username(claims).equals(userDetails.getUsername())
                && claims.getExpiration().after(new Date());
    }

    public String getUsernameFromToken(String token) {
        final Claims claims = parse(token);
        if (!"access".equals(claims.get("typ"))) {
            throw new IllegalArgumentException("not an access token");
        }
        return username(claims);
    }

    public String getUsernameFromRefreshToken(String token) {
        final Claims claims = parse(token);
        if (!"refresh".equals(claims.get("typ"))) {
            throw new IllegalArgumentException("not a refresh token");
        }
        return username(claims);
    }

    public String getJtiFromRefreshToken(String token) {
        final Claims claims = parse(token);
        if (!"refresh".equals(claims.get("typ"))) {
            throw new IllegalArgumentException("not a refresh token");
        }
        return claims.getId();
    }

    public Date getExpirationFromRefreshToken(String token) {
        return parse(token).getExpiration();
    }

    public long getAccessExpireSeconds() {
        return accessExpire;
    }

    public long getRefreshExpireSeconds() {
        return refreshExpire;
    }

    private String username(Claims claims) {
        String username = claims.get("username", String.class);
        return username == null ? claims.getSubject() : username;
    }

    private boolean subjectMatches(Claims claims, UserDetails userDetails) {
        if (!claims.containsKey("username")) {
            // 兼容升级前 subject 为 username 的旧 token
            return userDetails.getUsername().equals(claims.getSubject());
        }
        if (userDetails instanceof AuthUser authUser && authUser.getUserId() != null) {
            return authUser.getUserId().equals(claims.getSubject());
        }
        return userDetails.getUsername().equals(claims.getSubject());
    }

    private int tokenVersion(UserDetails userDetails) {
        return userDetails instanceof AuthUser authUser ? authUser.getTokenVersion() : 0;
    }

    // 解析
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(publicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
