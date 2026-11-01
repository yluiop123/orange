package com.orange.security;

import com.orange.domain.common.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SecurityResponseWriterTest {

    private final SecurityResponseWriter writer = new SecurityResponseWriter();

    @Test
    void writesUnifiedErrorBody() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        writer.write(response, ErrorCode.UNAUTHORIZED);

        String body = response.getContentAsString();
        assertEquals(401, response.getStatus());
        assertTrue(body.contains("\"code\":40101"));
        assertTrue(body.contains("\"message\":\"未登录\""));
        assertTrue(body.contains("\"traceId\""));
    }
}
