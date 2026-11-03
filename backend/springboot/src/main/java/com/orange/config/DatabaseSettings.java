package com.orange.config;

import org.springframework.core.env.Environment;

import java.util.Locale;

/**
 * 运行时数据库配置。优先级（从高到低）：
 *
 * <ol>
 *   <li>{@code SPRING_DATASOURCE_URL} / {@code SPRING_DATASOURCE_USERNAME} / {@code SPRING_DATASOURCE_PASSWORD}</li>
 *   <li>{@code DB_URL} / {@code DB_USER} / {@code DB_PASSWORD}</li>
 *   <li>{@code spring.datasource.*}（application.yaml 或 profile 文件）</li>
 *   <li>按 {@code DB_DRIVER} 推导的默认值（PostgreSQL 仍是默认引擎）</li>
 * </ol>
 *
 * {@code DB_DRIVER} 可选值为 {@code postgres} / {@code mysql} / {@code mariadb} / {@code sqlite}；
 * 未设置时从 JDBC URL 自动识别。
 */
public record DatabaseSettings(DbEngine engine, String url, String username, String password) {

    public String driverClassName() {
        return engine.driverClassName();
    }

    public String dialect() {
        return engine.dialect();
    }

    public static DatabaseSettings resolve(Environment env) {
        String rawUrl = firstNonBlank(
                env.getProperty("SPRING_DATASOURCE_URL"),
                env.getProperty("DB_URL"),
                env.getProperty("spring.datasource.url"));

        DbEngine declared = DbEngine.fromDriver(env.getProperty("DB_DRIVER"));
        DbEngine urlEngine = DbEngine.fromJdbcUrl(rawUrl);

        if (declared != null && !declared.isCompatibleWith(urlEngine)) {
            throw new IllegalStateException(
                    "DB_DRIVER=" + declared.key() + " does not match the JDBC URL ("
                            + urlEngine.key() + "). Use a matching URL or remove DB_DRIVER.");
        }
        if (declared == null && urlEngine == null && rawUrl != null) {
            throw new IllegalStateException(
                    "Cannot determine the database engine from JDBC URL '" + rawUrl
                            + "'. Set DB_DRIVER to postgres, mysql, mariadb or sqlite.");
        }

        DbEngine engine = declared != null ? declared : (urlEngine != null ? urlEngine : DbEngine.POSTGRES);
        String url = rawUrl != null ? normalizeUrl(engine, rawUrl) : engine.defaultJdbcUrl(
                env.getProperty("DB_HOST"),
                parsePort(env.getProperty("DB_PORT")),
                env.getProperty("DB_NAME"));

        String username = firstNonBlank(
                env.getProperty("SPRING_DATASOURCE_USERNAME"),
                env.getProperty("DB_USER"),
                env.getProperty("spring.datasource.username"));
        String password = firstNonBlank(
                env.getProperty("SPRING_DATASOURCE_PASSWORD"),
                env.getProperty("DB_PASSWORD"),
                env.getProperty("spring.datasource.password"));

        if (username == null) {
            username = switch (engine) {
                case POSTGRES -> "postgres";
                case MYSQL, MARIADB -> "root";
                case SQLITE -> "";
            };
        }
        if (password == null) {
            password = switch (engine) {
                case POSTGRES -> "postgres";
                case MYSQL, MARIADB -> "root";
                case SQLITE -> "";
            };
        }

        return new DatabaseSettings(engine, url, username, password);
    }

    private static String normalizeUrl(DbEngine engine, String url) {
        String resolved = url.trim();
        if (engine == DbEngine.MARIADB && resolved.toLowerCase(Locale.ROOT).startsWith("jdbc:mariadb:")) {
            // mysql-connector-j 不认 jdbc:mariadb:，但两套协议一致。
            resolved = "jdbc:mysql:" + resolved.substring("jdbc:mariadb:".length());
        }
        if (engine == DbEngine.SQLITE) {
            resolved = withSqliteOptions(resolved);
        }
        return resolved;
    }

    /**
     * SQLite 的 JDBC 驱动默认把时间戳写成 epoch 毫秒，而 database/sqlite 的列是 TEXT。
     * 强制 date_class=text 才能和 schema、CURRENT_TIMESTAMP 以及已有种子数据保持一致；
     * foreign_keys 必须每个连接开启，busy_timeout 避免并发写立刻返回 SQLITE_BUSY。
     */
    private static String withSqliteOptions(String url) {
        StringBuilder builder = new StringBuilder(url);
        char separator = url.contains("?") ? '&' : '?';
        if (!url.toLowerCase(Locale.ROOT).contains("date_class=")) {
            builder.append(separator).append("date_class=text");
            separator = '&';
        }
        if (!url.toLowerCase(Locale.ROOT).contains("foreign_keys=")) {
            builder.append(separator).append("foreign_keys=on");
            separator = '&';
        }
        if (!url.toLowerCase(Locale.ROOT).contains("busy_timeout=")) {
            builder.append(separator).append("busy_timeout=5000");
        }
        return builder.toString();
    }

    private static Integer parsePort(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Integer.valueOf(value.trim());
        } catch (NumberFormatException e) {
            throw new IllegalStateException("Invalid DB_PORT '" + value + "'", e);
        }
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    /**
     * 只用于日志，绝不打印密码。
     */
    public String describe() {
        return engine.key() + " (" + url + ", user=" + (username == null || username.isBlank() ? "<none>" : username) + ")";
    }
}
