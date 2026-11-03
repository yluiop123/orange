package com.orange.repository.system;

import com.orange.entity.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;

@Repository
public interface RevokedTokenRepository extends JpaRepository<RevokedToken, String> {
    void deleteByExpiresAtBefore(OffsetDateTime time);

    @Modifying
    @Query(value = """
            INSERT INTO sys_revoked_token (jti, token_type, expires_at, create_time)
            VALUES (:jti, :tokenType, :expiresAt, :createTime)
            ON CONFLICT (jti) DO NOTHING
            """, nativeQuery = true)
    int insertIfAbsent(@Param("jti") String jti,
                       @Param("tokenType") String tokenType,
                       @Param("expiresAt") OffsetDateTime expiresAt,
                       @Param("createTime") OffsetDateTime createTime);
}
