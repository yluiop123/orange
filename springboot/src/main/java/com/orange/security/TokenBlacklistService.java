package com.orange.security;

import com.orange.entity.RevokedToken;
import com.orange.repository.system.RevokedTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Date;

/**
 * refresh token 单 token 吊销：记录已轮换/登出的 jti，直到原过期时间。
 */
@Service
public class TokenBlacklistService {

    private final RevokedTokenRepository repository;

    public TokenBlacklistService(RevokedTokenRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void revoke(String jti, String tokenType, Date expiresAt) {
        if (jti == null || jti.isBlank()) return;
        repository.deleteByExpiresAtBefore(OffsetDateTime.now());
        if (repository.existsById(jti)) return;
        RevokedToken token = new RevokedToken();
        token.setJti(jti);
        token.setTokenType(tokenType);
        token.setExpiresAt(expiresAt.toInstant().atOffset(ZoneOffset.UTC));
        token.setCreateTime(OffsetDateTime.now());
        repository.save(token);
    }

    public boolean isRevoked(String jti) {
        return jti != null && !jti.isBlank() && repository.existsById(jti);
    }
}
