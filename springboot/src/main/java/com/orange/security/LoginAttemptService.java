package com.orange.security;

import com.orange.entity.LoginAttempt;
import com.orange.repository.system.LoginAttemptRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Locale;

/**
 * 登录失败限流：
 * - 单账号失败次数超过阈值后锁定；
 * - 单 IP 失败次数超过更高阈值后锁定；
 * - 计数存储在数据库中，多实例部署共享同一份状态。
 */
@Service
public class LoginAttemptService {

    private final LoginAttemptRepository repository;

    @Value("${app.auth.login-max-attempts:5}")
    private int userMaxAttempts = 5;

    @Value("${app.auth.login-ip-max-attempts:20}")
    private int ipMaxAttempts = 20;

    private final long lockMinutes;

    public LoginAttemptService(LoginAttemptRepository repository,
                               @Value("${app.auth.login-lock-minutes:15}") long lockMinutes) {
        this.repository = repository;
        this.lockMinutes = lockMinutes;
    }

    public boolean isBlocked(String ip, String username) {
        return repository.isLocked(ipKey(ip)) || repository.isLocked(userKey(username));
    }

    @Transactional
    public void onFailure(String ip, String username) {
        record(ipKey(ip), ipMaxAttempts);
        record(userKey(username), userMaxAttempts);
    }

    @Transactional
    public void onSuccess(String ip, String username) {
        // 只清理账号维度，避免攻击者用成功登录重置 IP 维度计数
        repository.findById(userKey(username)).ifPresent(repository::delete);
    }

    private void record(String key, int maxAttempts) {
        LoginAttempt attempt = repository.findForUpdate(key).orElse(null);
        OffsetDateTime now = OffsetDateTime.now();
        if (attempt == null) {
            attempt = new LoginAttempt();
            attempt.setKey(key);
            attempt.setFailures(1);
            attempt.setWindowStart(now);
            attempt.setUpdateTime(now);
            if (maxAttempts <= 1) attempt.setLockedUntil(now.plusMinutes(lockMinutes));
            try {
                repository.saveAndFlush(attempt);
                return;
            } catch (DataIntegrityViolationException e) {
                // 并发创建同一 key 时，改为更新已存在的记录
                attempt = repository.findForUpdate(key).orElse(null);
                if (attempt == null) throw e;
            }
        }
        if (attempt.getWindowStart() == null
                || attempt.getWindowStart().plusMinutes(lockMinutes).isBefore(now)) {
            attempt.setFailures(1);
            attempt.setWindowStart(now);
            attempt.setLockedUntil(null);
        } else {
            attempt.setFailures((attempt.getFailures() == null ? 0 : attempt.getFailures()) + 1);
        }
        if (attempt.getFailures() >= maxAttempts) {
            attempt.setLockedUntil(now.plusMinutes(lockMinutes));
        }
        attempt.setUpdateTime(now);
        repository.save(attempt);
    }

    private static String ipKey(String ip) {
        return "ip:" + (ip == null ? "" : ip.trim());
    }

    private static String userKey(String username) {
        return "user:" + (username == null ? "" : username.trim().toLowerCase(Locale.ROOT));
    }
}
