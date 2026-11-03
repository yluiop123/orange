package com.orange.domain.login.resp;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "权限信息")
@Data
public class PermissionInfo {
    @Schema(description = "权限路径",example = "/user")
    private String path;
    @Schema(description = "所属角色",example = "admin")
    private String role;
    @Schema(description = "权限类型",example = "menu")
    private String type;
    @Schema(description = "权限操作",example = "add")
    private String action;
}
