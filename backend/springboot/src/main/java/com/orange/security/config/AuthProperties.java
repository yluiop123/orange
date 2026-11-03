package com.orange.security.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(
        @DefaultValue("false") boolean cookieSecure,
        @DefaultValue("Lax") String cookieSameSite,
        @DefaultValue("") String cookieDomain,
        @DefaultValue("5") int loginMaxAttempts,
        @DefaultValue("20") int loginIpMaxAttempts,
        @DefaultValue("15") long loginLockMinutes) {
}
