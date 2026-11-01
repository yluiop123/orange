package com.orange.domain.system.permission.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Schema(description = "移动权限请求参数")
@Data
public class MovePermissionReq {
    @Schema(description = "权限ID",example = "1")
    @NotBlank(message = "权限ID不能为空")
    private String id;

    @Schema(description = "移动操作",example = "up",allowableValues = {"up","down","top"})
    @NotBlank(message = "移动操作不能为空")
    @Pattern(
            regexp = "up|down|top",
            message = "只能是 up 或 down 或 top"
    )
    private String action;
}
