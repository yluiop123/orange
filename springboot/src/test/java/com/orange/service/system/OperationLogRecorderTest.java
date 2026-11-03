package com.orange.service.system;

import com.orange.domain.system.operationlog.OperationLogRecord;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OperationLogRecorderTest {

    @Mock
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Test
    void writesEveryRecordedFieldWithOneColumnList() {
        OperationLogRecorder recorder = new OperationLogRecorder(jdbcTemplate);
        when(jdbcTemplate.update(anyString(), any(SqlParameterSource.class))).thenReturn(1);
        OffsetDateTime now = OffsetDateTime.parse("2026-11-03T08:00:00Z");

        recorder.record(new OperationLogRecord(
                "trace", "super", "POST", "/api/v1/system/users",
                "page=1", "{\"name\":\"ok\"}", 200, 12, "127.0.0.1", now));

        ArgumentCaptor<SqlParameterSource> params =
                ArgumentCaptor.forClass(SqlParameterSource.class);
        verify(jdbcTemplate).update(
                contains("insert into sys_operation_log"), params.capture());
        assertThat(params.getValue().getValue("traceId")).isEqualTo("trace");
        assertThat(params.getValue().getValue("username")).isEqualTo("super");
        assertThat(params.getValue().getValue("requestBody")).isEqualTo("{\"name\":\"ok\"}");
        assertThat(params.getValue().getValue("createTime")).isEqualTo(now);
    }
}
