package com.orange.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DatabaseSettingsTest {

    @Test
    void defaultsToPostgresWhenNothingIsConfigured() {
        DatabaseSettings settings = DatabaseSettings.resolve(new MockEnvironment());

        assertThat(settings.engine()).isEqualTo(DbEngine.POSTGRES);
        assertThat(settings.url()).isEqualTo("jdbc:postgresql://localhost:5432/orange");
        assertThat(settings.username()).isEqualTo("postgres");
        assertThat(settings.driverClassName()).isEqualTo("org.postgresql.Driver");
        assertThat(settings.dialect()).isEqualTo("org.hibernate.dialect.PostgreSQLDialect");
    }

    @Test
    void selectsEngineFromDbDriverAndDbUrl() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("DB_DRIVER", "mysql")
                .withProperty("DB_URL", "jdbc:mysql://db:53306/orange_spring")
                .withProperty("DB_USER", "root")
                .withProperty("DB_PASSWORD", "secret");

        DatabaseSettings settings = DatabaseSettings.resolve(env);

        assertThat(settings.engine()).isEqualTo(DbEngine.MYSQL);
        assertThat(settings.url()).isEqualTo("jdbc:mysql://db:53306/orange_spring");
        assertThat(settings.driverClassName()).isEqualTo("com.mysql.cj.jdbc.Driver");
        assertThat(settings.dialect()).isEqualTo("org.hibernate.dialect.MySQLDialect");
    }

    @Test
    void mariadbAcceptsBothJdbcSchemesAndUsesTheMysqlDriver() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("DB_DRIVER", "mariadb")
                .withProperty("DB_URL", "jdbc:mariadb://db:53307/orange");

        DatabaseSettings settings = DatabaseSettings.resolve(env);

        assertThat(settings.engine()).isEqualTo(DbEngine.MARIADB);
        assertThat(settings.url()).isEqualTo("jdbc:mysql://db:53307/orange");
        assertThat(settings.driverClassName()).isEqualTo("com.mysql.cj.jdbc.Driver");
        assertThat(settings.dialect()).isEqualTo("org.hibernate.dialect.MariaDBDialect");
    }

    @Test
    void sqliteUrlGetsTextDatesForeignKeysAndBusyTimeout() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("DB_DRIVER", "sqlite")
                .withProperty("DB_URL", "jdbc:sqlite:C:/tmp/orange.db");

        DatabaseSettings settings = DatabaseSettings.resolve(env);

        assertThat(settings.engine()).isEqualTo(DbEngine.SQLITE);
        assertThat(settings.url())
                .isEqualTo("jdbc:sqlite:C:/tmp/orange.db?date_class=text&foreign_keys=on&busy_timeout=5000");
        assertThat(settings.driverClassName()).isEqualTo("org.sqlite.JDBC");
        assertThat(settings.dialect()).isEqualTo("org.hibernate.community.dialect.SQLiteDialect");
    }

    @Test
    void rejectsDriverThatDoesNotMatchTheUrl() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("DB_DRIVER", "mysql")
                .withProperty("DB_URL", "jdbc:postgresql://localhost:5432/orange");

        assertThatThrownBy(() -> DatabaseSettings.resolve(env))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("does not match");
    }
}
