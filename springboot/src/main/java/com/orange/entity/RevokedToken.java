package com.orange.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.OffsetDateTime;

@Schema(description = "已吊销的 token")
@Entity
@Table(name = "sys_revoked_token")
@Data
public class RevokedToken {
    @Id
    @Column(name = "jti")
    private String jti;

    @Column(name = "token_type")
    private String tokenType;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "create_time")
    private OffsetDateTime createTime;
}
