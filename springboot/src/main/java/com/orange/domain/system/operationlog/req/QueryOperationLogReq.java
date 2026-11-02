package com.orange.domain.system.operationlog.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.OffsetDateTime;

@Schema(description = "查询操作日志请求参数")
@Data
public class QueryOperationLogReq {

    @Schema(description = "页码", example = "1")
    @Min(value = 1, message = "页码必须大于 0")
    private Integer page = 1;

    @Schema(description = "每页数量", example = "10")
    @Min(value = 1, message = "每页数量必须大于 0")
    @Max(value = 100, message = "每页数量不能超过 100")
    private Integer size = 10;

    @Schema(description = "操作人用户名")
    private String username;

    @Schema(description = "请求路径")
    private String path;

    @Schema(description = "HTTP 状态码", example = "200")
    @Pattern(regexp = "^$|^\\d{3}$", message = "状态码必须是 3 位数字")
    private String status;

    @Schema(description = "开始时间（ISO 8601）", example = "2026-11-01T00:00:00Z")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private OffsetDateTime from;

    @Schema(description = "结束时间（ISO 8601）", example = "2026-11-02T23:59:59Z")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private OffsetDateTime to;
}
