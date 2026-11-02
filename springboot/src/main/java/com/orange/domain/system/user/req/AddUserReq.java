package com.orange.domain.system.user.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Schema(description = "添加用户请求体")
@Data
public class AddUserReq {
    @Schema(description = "用户名", example = "张三")
    @NotBlank(message = "用户姓名不能为空")
    @Size(min = 2, max = 50, message = "用户姓名长度需在 2-50 之间")
    private String name;

    @Schema(description = "用户名", example = "admin")
    @NotBlank(message = "用户名不能为空")
    @Size(min = 4, max = 50, message = "用户名长度需在 4-50 之间")
    @Pattern(regexp = "^[A-Za-z0-9_]+$", message = "用户名只能包含字母、数字和下划线")
    private String username;

    @Schema(description = "邮箱", example = "admin@example.com")
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @Schema(description = "用户组ID", example = "1")
    @NotBlank(message = "用户组不能为空")
    private String groupId;

    @Schema(description = "手机号", example = "13800000000")
    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;

    @Schema(description = "状态", example = "1")
    @Pattern(regexp = "^(0|1)$", message = "状态只能是 0 或 1")
    private String status;

    @Schema(description = "角色ID列表",  example = "[\"1001\",\"1002\"]")
    private List<String> roles;

    @Schema(description = "权限ID列表",  example = "[\"1001\",\"1002\"]")
    private List<String> permissions;
}
