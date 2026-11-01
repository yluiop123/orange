package com.orange.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orange.domain.common.ErrorCode;
import com.orange.domain.common.Response;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * 在 Spring Security 过滤器链里输出与业务接口一致的 Response JSON。
 * 过滤器早于 Controller 执行，无法依赖 @RestControllerAdvice。
 */
@Component
public class SecurityResponseWriter {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String CONTENT_TYPE = "application/json;charset=UTF-8";

    public void write(HttpServletResponse response, ErrorCode errorCode) throws IOException {
        byte[] body = OBJECT_MAPPER.writeValueAsBytes(Response.error(errorCode));
        response.setStatus(errorCode.getHttpStatus());
        response.setContentType(CONTENT_TYPE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentLength(body.length);
        response.getOutputStream().write(body);
        response.flushBuffer();
    }
}
