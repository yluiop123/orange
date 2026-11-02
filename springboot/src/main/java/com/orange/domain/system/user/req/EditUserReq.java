package com.orange.domain.system.user.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Schema(description = "编辑用户请求体")
@Data
public class EditUserReq {
    @Schema(description = "用户ID",example = "1")
    private String id;

    @Schema(description = "用户姓名",example = "张三")
    @Size(min = 2, max = 50, message = "用户姓名长度需在 2-50 之间")
    private String name;

    @Schema(description = "用户名",example = "zhangsan")
    @Size(min = 4, max = 50, message = "用户名长度需在 4-50 之间")
    @Pattern(regexp = "^[A-Za-z0-9_]{4,50}$", message = "用户名只能包含字母、数字和下划线")
    private String username;

    @Schema(description = "用户邮箱",example = "zhangsan@example.com")
    @Email(message = "邮箱格式不正确")
    private String email;

    @Schema(description = "用户组ID",example = "1")
    private String groupId;

    @Schema(description = "用户手机号",example = "13800000000")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;

    @Schema(description = "用户状态",example = "1")
    @Pattern(regexp = "^(0|1)$", message = "状态只能是 0 或 1")
    private String status;

    @Schema(description = "用户角色ID列表",example = "[\"admin\",\"user\"]")
    private List<String> roles;

    @Schema(description = "用户权限ID列表",example = "[\"0001\",\"0002\"]")
    private List<String> permissions;
}
