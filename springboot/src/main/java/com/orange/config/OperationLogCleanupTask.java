package com.orange.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

/**
 * 定期清理过期操作日志，避免日志表无限增长。
 * 保留天数通过 app.operation-log.retention-days 配置，默认 90 天。
 */
@Component
@Slf4j
public class OperationLogCleanupTask {

    private final JdbcTemplate jdbcTemplate;
    private final int retentionDays;

    public OperationLogCleanupTask(
            JdbcTemplate jdbcTemplate,
            @Value("${app.operation-log.retention-days:90}") int retentionDays) {
        this.jdbcTemplate = jdbcTemplate;
        this.retentionDays = Math.max(1, retentionDays);
    }

    @Scheduled(cron = "${app.operation-log.cleanup-cron:0 30 3 * * *}")
    public void cleanExpiredLogs() {
        try {
            int deleted = jdbcTemplate.update(
                    "delete from sys_operation_log where create_time < ?",
                    OffsetDateTime.now().minusDays(retentionDays));
            if (deleted > 0) {
                log.info("deleted {} expired operation logs (retention {} days)", deleted, retentionDays);
            }
        } catch (Exception e) {
            log.warn("failed to clean expired operation logs: {}", e.getMessage());
        }
    }
}
