package com.orange.config;

import com.orange.util.TraceId;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;
import java.util.regex.Pattern;

/**
 * 为每个请求生成或透传 traceId，并缓存请求体供操作日志读取。
 * 客户端可以通过 X-Request-Id 传入自己的 ID，便于前后端串联。
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter extends OncePerRequestFilter {

    private static final Pattern SAFE_TRACE_ID = Pattern.compile("^[A-Za-z0-9._-]{8,64}$");
    private static final int BODY_CACHE_LIMIT = 8192;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String incoming = request.getHeader(TraceId.HEADER);
        String traceId = incoming != null && SAFE_TRACE_ID.matcher(incoming).matches()
                ? incoming
                : TraceId.newId();

        request.setAttribute(TraceId.REQUEST_ATTRIBUTE, traceId);
        response.setHeader(TraceId.HEADER, traceId);
        MDC.put(TraceId.MDC_KEY, traceId);
        try {
            HttpServletRequest effectiveRequest = request;
            if (shouldCacheBody(request)) {
                ContentCachingRequestWrapper wrapper =
                        new ContentCachingRequestWrapper(request, BODY_CACHE_LIMIT);
                // 后续 Spring Security 还会再包一层，用显式上下文传递缓存体
                OperationLogContext.attachBody(request, wrapper);
                effectiveRequest = wrapper;
            }
            filterChain.doFilter(effectiveRequest, response);
        } finally {
            MDC.remove(TraceId.MDC_KEY);
        }
    }

    private boolean shouldCacheBody(HttpServletRequest request) {
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return false;
        }
        String contentType = request.getContentType();
        return contentType != null && contentType.toLowerCase().contains("json");
    }
}
