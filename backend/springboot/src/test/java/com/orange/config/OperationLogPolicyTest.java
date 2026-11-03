package com.orange.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class OperationLogPolicyTest {

    @Test
    void recordsOnlySystemWritesAndPasswordChanges() {
        assertThat(OperationLogPolicy.shouldRecord("POST", "/api/v1/system/users")).isTrue();
        assertThat(OperationLogPolicy.shouldRecord("PATCH", "/api/v1/system/users/1")).isTrue();
        assertThat(OperationLogPolicy.shouldRecord("POST", "/api/v1/auth/change-password")).isTrue();
        assertThat(OperationLogPolicy.shouldRecord("POST", "/api/v1/auth/login")).isFalse();
        assertThat(OperationLogPolicy.shouldRecord("GET", "/api/v1/system/users")).isFalse();
        assertThat(OperationLogPolicy.shouldRecord("OPTIONS", "/api/v1/system/users")).isFalse();
    }

    @Test
    void marksPasswordAndTokenPathsAsSensitive() {
        assertThat(OperationLogPolicy.isSensitivePath("/api/v1/auth/login")).isTrue();
        assertThat(OperationLogPolicy.isSensitivePath("/api/v1/auth/refresh")).isTrue();
        assertThat(OperationLogPolicy.isSensitivePath("/api/v1/auth/change-password")).isTrue();
        assertThat(OperationLogPolicy.isSensitivePath("/api/v1/system/users/1/reset-password")).isTrue();
        assertThat(OperationLogPolicy.isSensitivePath("/api/v1/system/users")).isFalse();
    }

    @Test
    void redactsSensitiveJsonFieldsAndTruncates() {
        String body = "{\"password\":\"secret\",\"token\":\"abc\",\"name\":\"ok\"}";

        assertThat(OperationLogPolicy.sanitizeBody(body))
                .doesNotContain("secret")
                .doesNotContain("abc")
                .contains("\"***\"")
                .contains("ok");
        assertThat(OperationLogPolicy.sanitizeBody("a".repeat(5000))).hasSize(4000);
        assertThat(OperationLogPolicy.sanitizeBody(null)).isNull();
    }

    @Test
    void truncatesQueryStringAndResolvesClientIp() {
        assertThat(OperationLogPolicy.queryString("a".repeat(600))).hasSize(500);

        MockHttpServletRequest forwarded = new MockHttpServletRequest();
        forwarded.addHeader("X-Forwarded-For", "203.0.113.1, 10.0.0.1");
        assertThat(OperationLogPolicy.clientIp(forwarded)).isEqualTo("203.0.113.1");

        MockHttpServletRequest direct = new MockHttpServletRequest();
        direct.setRemoteAddr("127.0.0.1");
        assertThat(OperationLogPolicy.clientIp(direct)).isEqualTo("127.0.0.1");
    }
}
