package com.orange.domain.system.operationlog;

import java.time.OffsetDateTime;

/** 操作日志写入记录：与 sys_operation_log 的列一一对应。 */
public record OperationLogRecord(
        String traceId,
        String username,
        String method,
        String path,
        String queryString,
        String requestBody,
        int status,
        long durationMs,
        String ip,
        OffsetDateTime createTime) {
}
