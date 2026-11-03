package com.orange.domain.system.role.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Schema(description = "添加角色请求参数")
@Data
public class AddRoleReq {
    @Schema(description = "角色名称",example = "管理员")
    @NotBlank(message = "角色名称不能为空")
    @Size(min = 2, max = 50, message = "角色名称长度需在 2-50 之间")
    private String name;

    @Schema(description = "角色ID",example = "1")
    @Pattern(regexp = "^[A-Za-z0-9_-]{2,32}$", message = "角色ID只能包含字母、数字、下划线和中划线")
    private String id;

    @Schema(description = "权限列表")
    private List<String> permissions;
}
