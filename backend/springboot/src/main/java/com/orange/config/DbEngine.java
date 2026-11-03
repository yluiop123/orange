package com.orange.config;

import java.util.Locale;

/**
 * 支持的数据库引擎。一个引擎同时决定 JDBC 驱动、Hibernate 方言和
 * SQL 里必须分叉的少量写法（例如 upsert / 时间参数）。
 */
public enum DbEngine {

    POSTGRES("postgres", "postgresql", "org.postgresql.Driver",
            "org.hibernate.dialect.PostgreSQLDialect", 5432, "orange"),
    MYSQL("mysql", "mysql", "com.mysql.cj.jdbc.Driver",
            "org.hibernate.dialect.MySQLDialect", 3306, "orange"),
    // MariaDB 走 MySQL 协议，因此复用 mysql-connector-j 的驱动。
    MARIADB("mariadb", "mariadb", "com.mysql.cj.jdbc.Driver",
            "org.hibernate.dialect.MariaDBDialect", 3306, "orange"),
    SQLITE("sqlite", "sqlite", "org.sqlite.JDBC",
            "org.hibernate.community.dialect.SQLiteDialect", 0, "orange.db");

    private final String key;
    private final String scheme;
    private final String driverClassName;
    private final String dialect;
    private final int defaultPort;
    private final String defaultDatabase;

    DbEngine(String key, String scheme, String driverClassName, String dialect,
             int defaultPort, String defaultDatabase) {
        this.key = key;
        this.scheme = scheme;
        this.driverClassName = driverClassName;
        this.dialect = dialect;
        this.defaultPort = defaultPort;
        this.defaultDatabase = defaultDatabase;
    }

    public String key() {
        return key;
    }

    public String driverClassName() {
        return driverClassName;
    }

    public String dialect() {
        return dialect;
    }

    public int defaultPort() {
        return defaultPort;
    }

    public String defaultDatabase() {
        return defaultDatabase;
    }

    /**
     * 解析 DB_DRIVER。接受 postgres / postgresql / mysql / mariadb / sqlite（大小写不敏感）。
     */
    public static DbEngine fromDriver(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        for (DbEngine engine : values()) {
            if (engine.key.equals(normalized) || engine.scheme.equals(normalized)) {
                return engine;
            }
        }
        throw new IllegalArgumentException(
                "Unsupported DB_DRIVER '" + value + "'. Use postgres, mysql, mariadb or sqlite.");
    }

    /**
     * 从 JDBC URL 推断引擎；无法识别时返回 null。
     */
    public static DbEngine fromJdbcUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String lower = url.trim().toLowerCase(Locale.ROOT);
        if (lower.startsWith("jdbc:postgresql:")) {
            return POSTGRES;
        }
        if (lower.startsWith("jdbc:mysql:")) {
            return MYSQL;
        }
        if (lower.startsWith("jdbc:mariadb:")) {
            return MARIADB;
        }
        if (lower.startsWith("jdbc:sqlite:")) {
            return SQLITE;
        }
        return null;
    }

    /**
     * MariaDB 可以使用 jdbc:mariadb: 或 jdbc:mysql: 两种 URL；其余引擎必须与 URL 匹配。
     */
    public boolean isCompatibleWith(DbEngine urlEngine) {
        if (urlEngine == null || urlEngine == this) {
            return true;
        }
        return (this == MYSQL && urlEngine == MARIADB)
                || (this == MARIADB && urlEngine == MYSQL);
    }

    public String defaultJdbcUrl(String host, Integer port, String database) {
        String resolvedHost = host == null || host.isBlank() ? "localhost" : host;
        String resolvedDatabase = database == null || database.isBlank() ? defaultDatabase : database;
        return switch (this) {
            case POSTGRES -> "jdbc:postgresql://" + resolvedHost + ":" + (port == null ? defaultPort : port)
                    + "/" + resolvedDatabase;
            case MYSQL, MARIADB -> "jdbc:mysql://" + resolvedHost + ":" + (port == null ? defaultPort : port)
                    + "/" + resolvedDatabase;
            case SQLITE -> "jdbc:sqlite:" + resolvedDatabase;
        };
    }
}
