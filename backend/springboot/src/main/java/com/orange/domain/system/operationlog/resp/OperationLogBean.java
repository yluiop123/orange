package com.orange.domain.system.operationlog.resp;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.OffsetDateTime;

@Schema(description = "操作日志")
@Data
public class OperationLogBean {

    @Schema(description = "日志 ID")
    private Long id;

    @Schema(description = "链路追踪 ID")
    private String traceId;

    @Schema(description = "操作人")
    private String username;

    @Schema(description = "HTTP 方法")
    private String method;

    @Schema(description = "请求路径")
    private String path;

    @Schema(description = "查询参数")
    private String queryString;

    @Schema(description = "请求体（已脱敏）")
    private String requestBody;

    @Schema(description = "HTTP 状态码")
    private Integer status;

    @Schema(description = "耗时毫秒")
    private Long durationMs;

    @Schema(description = "客户端 IP")
    private String ip;

    @Schema(description = "操作时间")
    private OffsetDateTime createTime;
}
