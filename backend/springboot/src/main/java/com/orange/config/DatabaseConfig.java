package com.orange.config;

import com.orange.util.DatabaseValues;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

/**
 * 数据库装配：一个开关（DB_DRIVER + URL）选择驱动、方言和连接池参数。
 *
 * <p>不启用 {@code ddl-auto}：每个引擎使用 database/&lt;engine&gt;/ddl.sql 创建的表结构。</p>
 */
@Slf4j
@Configuration
public class DatabaseConfig {

    @Bean
    public DatabaseSettings databaseSettings(Environment environment) {
        DatabaseSettings settings = DatabaseSettings.resolve(environment);
        log.info("database: {}", settings.describe());
        return settings;
    }

    /**
     * HikariCP 配置继续从 spring.datasource.hikari.* 绑定；URL、账号、驱动由
     * {@link DatabaseSettings} 统一解析，避免每个引擎写一份 profile。
     */
    @Bean
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariDataSource dataSource(DatabaseSettings settings) {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(settings.url());
        dataSource.setDriverClassName(settings.driverClassName());
        if (settings.username() != null && !settings.username().isEmpty()) {
            dataSource.setUsername(settings.username());
        }
        if (settings.password() != null && !settings.password().isEmpty()) {
            dataSource.setPassword(settings.password());
        }
        return dataSource;
    }

    @Bean
    public HibernatePropertiesCustomizer databaseDialectCustomizer(DatabaseSettings settings) {
        return properties -> properties.put("hibernate.dialect", settings.dialect());
    }

    @Bean
    public DatabaseValues databaseValues(DatabaseSettings settings) {
        return new DatabaseValues(settings.engine());
    }
}
