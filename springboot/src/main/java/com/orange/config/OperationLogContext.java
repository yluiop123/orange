package com.orange.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.nio.charset.StandardCharsets;

/**
 * 请求体缓存的显式上下文，替代通过 ContentCachingRequestWrapper 类名属性通信。
 */
public final class OperationLogContext {

    private static final String BODY_ATTRIBUTE =
            OperationLogContext.class.getName() + ".body";

    private OperationLogContext() {
    }

    public static void attachBody(HttpServletRequest request,
                                  ContentCachingRequestWrapper wrapper) {
        request.setAttribute(BODY_ATTRIBUTE, wrapper);
    }

    public static String body(HttpServletRequest request) {
        Object value = request.getAttribute(BODY_ATTRIBUTE);
        if (!(value instanceof ContentCachingRequestWrapper wrapper)) {
            return null;
        }
        byte[] content = wrapper.getContentAsByteArray();
        return content.length == 0 ? null : new String(content, StandardCharsets.UTF_8);
    }
}
