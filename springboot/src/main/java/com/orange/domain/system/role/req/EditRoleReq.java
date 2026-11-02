package com.orange.domain.system.role.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Schema(description = "编辑角色请求参数")
@Data
public class EditRoleReq {
    @Schema(description = "角色ID",example = "1")
    private String id;

    @Schema(description = "角色名称",example = "管理员")
    @Size(min = 2, max = 50, message = "角色名称长度需在 2-50 之间")
    private String name;

    @Schema(description = "角色状态",example = "1")
    @Pattern(regexp = "^(0|1)$", message = "状态只能是 0 或 1")
    private String status;

    @Schema(description = "权限ID列表",example = "[ \"1\",\"2\",\"3\" ]")
    private List<String> permissions;
}
