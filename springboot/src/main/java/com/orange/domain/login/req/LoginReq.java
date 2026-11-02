package com.orange.domain.login.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Schema(description = "登录请求参数")
@Data
public class LoginReq {
    @Schema(description = "用户名",example = "admin")
    @NotBlank(message = "用户名不能为空")
    @Pattern(
            regexp = "^[A-Za-z0-9_]{4,50}$",
            message = "只能包含字母、数字和下划线，且长度需在 4-50 之间"
    )
    private String username;

    @Schema(description = "密码",example = "123456")
    @NotBlank(message = "密码不能为空")
    private String password;
}
