package com.orange.domain.system.user.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Schema(description = "删除用户请求体")
@Data
public class DeleteUserReq {
    @Schema(description = "用户ID列表", example = "[\"1001\",\"1002\"]")
    @NotEmpty(message = "用户ID列表不能为空")
    private List<String> ids;
}
