package com.orange.domain.system.user.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Schema(description = "用户列表查询请求参数")
@Data
public class QueryUserReq {

    @Schema(description = "过滤字段", example = "username")
    private String filterField;

    @Schema(description = "过滤值", example = "admin")
    private String filterValue;

    @Schema(description = "分组ID", example = "1001")
    private String groupId;

    @Schema(description = "排序字段", example = "username")
    private String orderField;

    @Schema(description = "排序值", example = "asc")
    @jakarta.validation.constraints.Pattern(regexp = "^(asc|desc)$", message = "排序方向只能是 asc 或 desc")
    private String orderValue;

    @Schema(description = "页码", example = "1")
    @Min(value = 1, message = "页码不能小于 1")
    @Max(value = 10000, message = "页码不能超过 10000")
    private Integer page = 1;

    @Schema(description = "每页数量", example = "10")
    @Min(value = 1, message = "每页数量不能小于 1")
    @Max(value = 100, message = "每页数量不能超过 100")
    private Integer size = 10;
}
