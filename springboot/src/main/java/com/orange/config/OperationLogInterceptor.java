package com.orange.config;

import com.orange.domain.system.operationlog.OperationLogRecord;
import com.orange.service.system.OperationLogRecorder;
import com.orange.util.TraceId;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.OffsetDateTime;

/**
 * 只负责从请求/响应构造记录，写入策略和 SQL 都在记录器与策略 module 里。
 */
@Component
@Slf4j
public class OperationLogInterceptor implements HandlerInterceptor {

    private static final String START_ATTR = OperationLogInterceptor.class.getName() + ".start";

    private final OperationLogRecorder recorder;

    public OperationLogInterceptor(OperationLogRecorder recorder) {
        this.recorder = recorder;
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
        String path = request.getRequestURI();
        if (!OperationLogPolicy.shouldRecord(method, path)) {
            return;
        }
        Object start = request.getAttribute(START_ATTR);
        long duration = start instanceof Long value ? System.currentTimeMillis() - value : 0;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication == null ? "anonymous" : authentication.getName();

        OperationLogRecord record = new OperationLogRecord(
                TraceId.fromRequest(request),
                username,
                method,
                path,
                OperationLogPolicy.queryString(request.getQueryString()),
                OperationLogPolicy.body(request, path),
                response.getStatus(),
                duration,
                OperationLogPolicy.clientIp(request),
                OffsetDateTime.now());
        try {
            recorder.record(record);
        } catch (Exception e) {
            log.warn("failed to write operation log: {}", e.getMessage());
        }
    }
}
