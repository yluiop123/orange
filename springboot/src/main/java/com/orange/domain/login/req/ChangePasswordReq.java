package com.orange.domain.login.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Schema(description = "修改密码请求参数")
@Data
public class ChangePasswordReq {
    @Schema(description = "原密码", example = "old-password")
    @NotBlank(message = "原密码不能为空")
    private String oldPassword;

    @Schema(description = "新密码", example = "new-password")
    @NotBlank(message = "新密码不能为空")
    @Size(min = 8, max = 64, message = "新密码长度需在 8-64 之间")
    private String newPassword;
}
