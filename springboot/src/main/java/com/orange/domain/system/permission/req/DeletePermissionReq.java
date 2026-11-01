package com.orange.domain.system.permission.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Schema(description = "删除权限请求参数")
@Data
public class DeletePermissionReq {
    @Schema(description = "权限ID列表",example = "[ \"1\",\"2\",\"3\" ]")
    @NotEmpty(message = "权限ID列表不能为空")
    private List<String> ids;
}
