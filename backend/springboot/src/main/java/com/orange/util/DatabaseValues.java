package com.orange.util;

import com.orange.config.DbEngine;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * JDBC 层（操作日志、token 黑名单）跨引擎的时间参数转换。
 *
 * <p>Hibernate 的 OffsetDateTime 绑定使用 UTC 日历，因此这里也统一按 UTC 落库：
 * MySQL/MariaDB 存 DATETIME（UTC 墙上时间），SQLite 存 schema 约定的
 * {@code yyyy-MM-dd HH:mm:ss.SSS} TEXT，PostgreSQL 直接用 timestamptz。</p>
 */
public final class DatabaseValues {

    private static final DateTimeFormatter SQLITE_TIMESTAMP =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    private final DbEngine engine;

    public DatabaseValues(DbEngine engine) {
        this.engine = engine;
    }

    /**
     * 写入时间参数时使用的 JDBC 值。
     */
    public Object timestamp(OffsetDateTime value) {
        if (value == null) {
            return null;
        }
        OffsetDateTime utc = value.withOffsetSameInstant(ZoneOffset.UTC);
        return switch (engine) {
            case POSTGRES -> value;
            case MYSQL, MARIADB -> utc.toLocalDateTime();
            case SQLITE -> SQLITE_TIMESTAMP.format(utc);
        };
    }

    /**
     * 读取时间列。不同驱动返回 Timestamp / LocalDateTime / String，统一转成 UTC offset。
     */
    public OffsetDateTime readTimestamp(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof OffsetDateTime offsetDateTime) {
            return offsetDateTime;
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toInstant().atOffset(ZoneOffset.UTC);
        }
        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime.atOffset(ZoneOffset.UTC);
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant().atOffset(ZoneOffset.UTC);
        }
        String text = value.toString().trim();
        if (text.isEmpty()) {
            return null;
        }
        String iso = text.replace(' ', 'T');
        try {
            return OffsetDateTime.parse(iso, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        } catch (DateTimeParseException ignored) {
            // 继续尝试不带 offset 的格式
        }
        try {
            return LocalDateTime.parse(iso, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                    .atOffset(ZoneOffset.UTC);
        } catch (DateTimeParseException e) {
            throw new IllegalStateException("Unsupported timestamp value: " + value, e);
        }
    }
}
