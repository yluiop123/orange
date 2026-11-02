package com.orange.util;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;

import java.util.UUID;

/** 每次请求一致的链路 ID：响应头、错误响应和操作日志共用。 */
public final class TraceId {

    public static final String MDC_KEY = "traceId";
    public static final String HEADER = "X-Request-Id";
    public static final String REQUEST_ATTRIBUTE = TraceId.class.getName() + ".traceId";

    private TraceId() {
    }

    public static String newId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    public static String currentOrNew() {
        String traceId = MDC.get(MDC_KEY);
        return traceId == null || traceId.isBlank() ? newId() : traceId;
    }

    public static String fromRequest(HttpServletRequest request) {
        Object value = request.getAttribute(REQUEST_ATTRIBUTE);
        return value instanceof String traceId && !traceId.isBlank()
                ? traceId
                : currentOrNew();
    }
}
