package com.orange.domain.system.permission.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Schema(description = "查询权限请求参数")
@Data
public class QueryPermissionReq {
    @Schema(description = "权限ID")
    private String id;

    @Schema(description = "权限名称")
    private String name;

    @Schema(description = "权限路径")
    private String path;

    @Schema(description = "权限状态",allowableValues = {"1","0","all"})
    @Pattern(regexp = "^(0|1|all)$", message = "状态只能是 0、1 或 all")
    private String status;

    @Schema(description = "权限类型", allowableValues = {"menu", "directory", "action", "all"})
    @Pattern(regexp = "^(menu|directory|action|all)$", message = "权限类型只能是 menu、directory、action 或 all")
    private String type;
}
