package com.orange.domain.system.user.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Schema(description = "用户列表查询请求参数")
@Data
public class QueryUserReq {

    @Schema(description = "关键词，匹配姓名、用户名、邮箱或手机号", example = "admin")
    private String keyword;

    @Schema(description = "用户状态", allowableValues = {"0", "1", "all"})
    @jakarta.validation.constraints.Pattern(regexp = "^$|^(0|1|all)$", message = "状态只能是 0、1 或 all")
    private String status;

    @Schema(description = "分组ID", example = "1001")
    private String groupId;

    @Schema(description = "排序字段", example = "username")
    private String sort;

    @Schema(description = "排序方向", allowableValues = {"asc", "desc"})
    @jakarta.validation.constraints.Pattern(regexp = "^$|^(asc|desc)$", message = "排序方向只能是 asc 或 desc")
    private String direction;

    @Deprecated
    @Schema(description = "旧版过滤字段，仅用于兼容", deprecated = true)
    private String filterField;

    @Deprecated
    @Schema(description = "旧版过滤值，仅用于兼容", deprecated = true)
    private String filterValue;

    @Deprecated
    @Schema(description = "旧版排序字段，仅用于兼容", deprecated = true)
    private String orderField;

    @Deprecated
    @Schema(description = "旧版排序方向，仅用于兼容", deprecated = true)
    @jakarta.validation.constraints.Pattern(regexp = "^$|^(asc|desc)$", message = "排序方向只能是 asc 或 desc")
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
