package com.orange.domain.login.resp;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "角色信息")
@Data
public class RoleInfo {
    @Schema(description = "角色编码",example = "1")
    private String id;

    @Schema(description = "角色名称",example = "admin")
    private String name;
}
