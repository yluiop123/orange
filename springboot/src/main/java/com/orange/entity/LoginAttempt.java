package com.orange.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Entity
@Table(name = "sys_login_attempt")
public class LoginAttempt {
    @Id
    @Column(name = "attempt_key")
    private String key;

    @Column(name = "failures")
    private Integer failures = 0;

    @Column(name = "window_start")
    private OffsetDateTime windowStart;

    @Column(name = "locked_until")
    private OffsetDateTime lockedUntil;

    @Column(name = "update_time")
    private OffsetDateTime updateTime;
}
