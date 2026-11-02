package com.orange.config;

import com.orange.util.TraceId;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * 记录系统管理相关写操作。请求体只保留非敏感接口的内容，并做脱敏和截断。
 */
@Component
@Slf4j
public class OperationLogInterceptor implements HandlerInterceptor {

    private static final String START_ATTR = OperationLogInterceptor.class.getName() + ".start";
    private static final int QUERY_LIMIT = 500;
    private static final int BODY_LIMIT = 4000;
    private static final Pattern SENSITIVE_JSON_FIELD = Pattern.compile(
            "(?i)(\"[^\"]*(?:password|token|secret)[^\"]*\"\\s*:\\s*)\"(?:[^\"\\\\]|\\\\.)*\"");

    private final JdbcTemplate jdbcTemplate;

    public OperationLogInterceptor(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute(START_ATTR, System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler,
                                Exception ex) {
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return;
        }
        String path = request.getRequestURI();
        if (!path.startsWith("/api/v1/system/") && !path.equals("/api/v1/auth/change-password")) {
            return;
        }
        Object start = request.getAttribute(START_ATTR);
        long duration = start instanceof Long value ? System.currentTimeMillis() - value : 0;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication == null ? "anonymous" : authentication.getName();
        String query = truncate(request.getQueryString(), QUERY_LIMIT);
        String body = readBody(request, path);
        try {
            jdbcTemplate.update(
                    "insert into sys_operation_log"
                            + "(trace_id,username,method,path,query_string,request_body,status,duration_ms,ip,create_time) "
                            + "values (?,?,?,?,?,?,?,?,?,?)",
                    TraceId.fromRequest(request),
                    username,
                    method,
                    path,
                    query,
                    body,
                    response.getStatus(),
                    duration,
                    clientIp(request),
                    OffsetDateTime.now());
        } catch (Exception e) {
            log.warn("failed to write operation log: {}", e.getMessage());
        }
    }

    private String readBody(HttpServletRequest request, String path) {
        if (isSensitivePath(path)) {
            return null;
        }
        Object cached = request.getAttribute(ContentCachingRequestWrapper.class.getName());
        if (!(cached instanceof ContentCachingRequestWrapper wrapper)) {
            return null;
        }
        byte[] content = wrapper.getContentAsByteArray();
        if (content.length == 0) {
            return null;
        }
        String body = new String(content, StandardCharsets.UTF_8);
        return truncate(SENSITIVE_JSON_FIELD.matcher(body).replaceAll("$1\"***\""), BODY_LIMIT);
    }

    private boolean isSensitivePath(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        return lower.endsWith("/login")
                || lower.endsWith("/refresh")
                || lower.endsWith("/change-password")
                || lower.endsWith("/reset-password");
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return (comma >= 0 ? forwarded.substring(0, comma) : forwarded).trim();
        }
        return request.getRemoteAddr();
    }
}
