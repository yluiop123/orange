package com.orange.domain.system.permission.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Map;


@Schema(description = "编辑权限请求参数")
@Data
public class EditPermissionReq {
    @Schema(description = "权限编码",example = "1")
    private String id;

    @Schema(description = "权限名称",example = "用户管理")
    @Size(min = 2, max = 50, message = "权限名称长度需在 2-50 之间")
    private String name;

    @Schema(description = "权限路径",example = "/user")
    @Size(max = 200, message = "权限路径长度不能超过 200")
    private String path;

    @Schema(description = "权限操作",example = "list")
    private String action;

    @Schema(description = "权限状态",example = "1")
    @Pattern(regexp = "^(0|1)$", message = "状态只能是 0 或 1")
    private String status;

    @Schema(description = "权限类型",example = "menu")
    @Pattern(regexp = "^(menu|action|directory)$", message = "权限类型只能是 menu、action 或 directory")
    private String type;

    @Schema(description = "本地化名称，locale -> 名称；null 表示不修改，空对象表示清空", example = "{\"en\":\"Users\"}")
    private Map<String, String> translations;
}
