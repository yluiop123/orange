package com.orange.domain.system.role.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Schema(description = "删除角色请求参数")
@Data
public class DeleteRoleReq {
    @Schema(description = "角色ID列表")
    @NotEmpty(message = "角色ID列表不能为空")
    private List<String> ids;
}
