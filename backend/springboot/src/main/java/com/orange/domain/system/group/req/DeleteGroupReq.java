package com.orange.domain.system.group.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Schema(description = "删除组织请求参数")
@Data
public class DeleteGroupReq {

    @NotEmpty(message = "组织ID列表不能为空")
    @Schema(description = "组织ID列表")
    private List<String> ids;
}
