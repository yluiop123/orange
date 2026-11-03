package com.orange.domain.system.user.resp;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "用户所属角色")
@Data
public class UserRoleBean {
    @Schema(description = "角色ID", example = "1")
    private String id;

    @Schema(description = "角色名称", example = "管理员")
    private String name;
}
