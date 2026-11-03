package com.orange.domain.system.group.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Schema(description = "编辑组织请求参数")
@Data
public class EditGroupReq {

    @Schema(description = "组织ID",example = "1")
    @Pattern(
            regexp = "^[A-Za-z0-9]{2,}$",
            message = "只能包含数字和大小写字母"
    )
    private String id;

    @Schema(description = "组织名称",example = "管理员")
    @NotBlank(message = "组织名称不能为空")
    private String name;

    @Schema(description = "组织状态",example = "1",allowableValues = {"0","1"})
    @Pattern(
            regexp = "^[01]$",
            message = "状态只能是 0 或 1"
    )
    private String status;
}
