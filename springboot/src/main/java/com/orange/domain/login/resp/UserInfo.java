package com.orange.domain.login.resp;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Schema(description = "用户信息")
@Data
public class UserInfo {
    @Schema(description = "用户编码",example = "1")
    private String id;

    @Schema(description = "用户姓名",example = "admin")
    private String name;

    @Schema(description = "用户名",example = "admin")
    private String username;

    @Schema(description = "用户邮箱",example = "admin@example.com")
    private String email;

    @Schema(description = "用户组编码",example = "1")
    private String groupId;

    @Schema(description = "用户组名称",example = "admin")
    private String groupName;

    @Schema(description = "用户手机号",example = "13800000000")
    private String phone;

    @Schema(description = "用户状态",example = "active")
    private String status;

    @Schema(description = "是否需要强制修改密码",example = "false")
    private Boolean mustChangePassword;

    @Schema(description = "创建时间",example = "2023-01-01 00:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ssXXX")
    private OffsetDateTime createTime;

    @Schema(description = "更新时间",example = "2023-01-01 00:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ssXXX")
    private OffsetDateTime updateTime;

    @Schema(description = "用户角色列表")
    private Set<RoleInfo> roles = new HashSet<>();

    @Schema(description = "用户角色权限列表")
    private Set<PermissionInfo> rolePermissions = new HashSet<>();

    @Schema(description = "用户权限列表")
    private Set<PermissionInfo> userPermissions = new HashSet<>();

}
