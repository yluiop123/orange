package com.orange.config;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * 操作日志的写入策略：哪些请求记录、哪些字段脱敏、如何截断、客户端 IP 怎么取。
 * 纯静态规则，不依赖数据库，便于单元测试。
 */
public final class OperationLogPolicy {

    private static final int QUERY_LIMIT = 500;
    private static final int BODY_LIMIT = 4000;
    private static final Pattern SENSITIVE_JSON_FIELD = Pattern.compile(
            "(?i)(\"[^\"]*(?:password|token|secret)[^\"]*\"\\s*:\\s*)\"(?:[^\"\\\\]|\\\\.)*\"");

    private OperationLogPolicy() {
    }

    public static boolean shouldRecord(String method, String path) {
        if ("GET".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return false;
        }
        return path.startsWith("/api/v1/system/")
                || path.equals("/api/v1/auth/change-password");
    }

    public static boolean isSensitivePath(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        return lower.endsWith("/login")
                || lower.endsWith("/refresh")
                || lower.endsWith("/change-password")
                || lower.endsWith("/reset-password");
    }

    public static String body(HttpServletRequest request, String path) {
        if (isSensitivePath(path)) {
            return null;
        }
        return sanitizeBody(OperationLogContext.body(request));
    }

    /** 脱敏 password/token/secret 字段，并截断到 4000 字符。 */
    public static String sanitizeBody(String body) {
        if (body == null) {
            return null;
        }
        String redacted = SENSITIVE_JSON_FIELD.matcher(body).replaceAll("$1\"***\"");
        return redacted.length() <= BODY_LIMIT ? redacted : redacted.substring(0, BODY_LIMIT);
    }

    public static String queryString(String query) {
        return truncate(query, QUERY_LIMIT);
    }

    public static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return (comma >= 0 ? forwarded.substring(0, comma) : forwarded).trim();
        }
        return request.getRemoteAddr();
    }

    private static String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
