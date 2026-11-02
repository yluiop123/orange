package com.orange.domain.system.group.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Schema(description = "添加子组织请求参数")
@Data
public class AddChildGroupReq {
    @Schema(description = "子组织ID")
    @NotBlank(message = "分组ID不能为空")
    @Pattern(
            regexp = "^[0-9]{2,}$",
            message = "组织编码只能包含数字"
    )
    private String id;

    @Schema(description = "子组织名称")
    @NotBlank(message = "分组名称不能为空")
    private String name;

    @Schema(description = "父组织ID")
    private String parentId;
}
