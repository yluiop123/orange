package com.orange.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.OffsetDateTime;

/**
 * 记录系统管理相关写操作的简化审计日志。
 * 只记录方法、路径、状态和耗时，不记录请求体，避免密码等敏感信息落库。
 */
@Component
@Slf4j
public class OperationLogInterceptor implements HandlerInterceptor {

    private static final String START_ATTR = OperationLogInterceptor.class.getName() + ".start";

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
        if (!path.startsWith("/api/system/") && !path.equals("/api/user/change-password")) {
            return;
        }
        Object start = request.getAttribute(START_ATTR);
        long duration = start instanceof Long value ? System.currentTimeMillis() - value : 0;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication == null ? "anonymous" : authentication.getName();
        String query = request.getQueryString();
        if (query != null && query.length() > 500) {
            query = query.substring(0, 500);
        }
        try {
            jdbcTemplate.update(
                    "insert into sys_operation_log(username,method,path,query_string,status,duration_ms,ip,create_time) "
                            + "values (?,?,?,?,?,?,?,?)",
                    username,
                    method,
                    path,
                    query,
                    response.getStatus(),
                    duration,
                    request.getRemoteAddr(),
                    OffsetDateTime.now());
        } catch (Exception e) {
            log.warn("failed to write operation log: {}", e.getMessage());
        }
    }
}
