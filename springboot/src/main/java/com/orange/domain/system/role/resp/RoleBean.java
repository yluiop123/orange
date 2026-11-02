package com.orange.domain.system.role.resp;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Schema(description = "角色详情")
@Data
public class RoleBean {
    @Schema(description = "角色名称")
    private String name;

    @Schema(description = "角色ID")
    private String id;

    @Schema(description = "角色状态", example = "1")
    private String status;

    @Schema(description = "权限列表")
    private List<String> permissions;
}
