package com.orange.security.auth;

import com.orange.config.DatabaseSettings;
import com.orange.repository.system.RevokedTokenRepository;
import com.orange.util.DatabaseValues;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * refresh token 单 token 吊销：记录已轮换/登出的 jti，直到原过期时间。
 */
@Service
public class TokenBlacklistService {

    private final RevokedTokenRepository repository;
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final DatabaseValues databaseValues;
    private final String insertIfAbsentSql;

    public TokenBlacklistService(RevokedTokenRepository repository,
                                 NamedParameterJdbcTemplate jdbcTemplate,
                                 DatabaseValues databaseValues,
                                 DatabaseSettings settings) {
        this.repository = repository;
        this.jdbcTemplate = jdbcTemplate;
        this.databaseValues = databaseValues;
        // MySQL/MariaDB 没有 ON CONFLICT，改用 INSERT IGNORE；PostgreSQL 与 SQLite 共享 ON CONFLICT。
        this.insertIfAbsentSql = switch (settings.engine()) {
            case MYSQL, MARIADB -> """
                    insert ignore into sys_revoked_token (jti, token_type, expires_at, create_time)
                    values (:jti, :tokenType, :expiresAt, :createTime)
                    """;
            case POSTGRES, SQLITE -> """
                    insert into sys_revoked_token (jti, token_type, expires_at, create_time)
                    values (:jti, :tokenType, :expiresAt, :createTime)
                    on conflict (jti) do nothing
                    """;
        };
    }

    @Transactional
    public boolean revoke(String jti, String tokenType, Instant expiresAt) {
        if (jti == null || jti.isBlank() || expiresAt == null) {
            return false;
        }
        repository.deleteByExpiresAtBefore(OffsetDateTime.now());
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("jti", jti)
                .addValue("tokenType", tokenType)
                .addValue("expiresAt", databaseValues.timestamp(expiresAt.atOffset(ZoneOffset.UTC)))
                .addValue("createTime", databaseValues.timestamp(OffsetDateTime.now()));
        int inserted = jdbcTemplate.update(insertIfAbsentSql, params);
        return inserted > 0;
    }

    public boolean isRevoked(String jti) {
        return jti != null && !jti.isBlank() && repository.existsById(jti);
    }
}
