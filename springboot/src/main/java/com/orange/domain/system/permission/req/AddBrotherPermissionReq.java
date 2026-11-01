package com.orange.domain.system.permission.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Schema(description = "添加兄弟权限请求参数")
@Data
public class AddBrotherPermissionReq {
    @Schema(description = "权限编码",example = "0103")
    @NotBlank(message = "权限编码不能为空")
    @Pattern(regexp = "^[A-Za-z0-9]{2,}$", message = "权限编码只能包含数字和大小写字母")
    private String id;

    @Schema(description = "权限名称",example = "角色管理")
    @NotBlank(message = "权限名称不能为空")
    private String name;

    @Schema(description = "权限路径",example = "/role")
    @NotBlank(message = "权限路径不能为空")
    private String path;

    @Schema(description = "权限操作",example = "add")
    private String action;

    @Schema(description = "权限类型",example = "menu")
    @NotBlank(message = "权限类型不能为空")
    @Pattern(regexp = "menu|action|directory", message = "权限类型只能是 menu、action 或 directory")
    private String type;

    @Schema(description = "兄弟权限编码",example = "0102")
    @NotBlank(message = "兄弟权限编码不能为空")
    private String brotherId;
}
