package com.orange.domain.system.group.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Schema(description = "查询组织请求参数")
@Data
public class QueryGroupReq {

    @Schema(description = "组织ID")
    @Pattern(
            regexp = "^[A-Za-z0-9]+$",
            message = "只能包含数字和大小写字母"
    )
    private String id;

    @Schema(description = "组织名称")
    private String name;

    @Pattern(
            regexp = "^(0|1|all)$",
            message = "只能是 0 或 1 或 all"
    )
    @Schema(description = "组织状态")
    private String status;
}
