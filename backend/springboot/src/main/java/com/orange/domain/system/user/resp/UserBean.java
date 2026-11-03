package com.orange.domain.system.user.resp;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Schema(description = "用户信息")
@Data
public class UserBean {
    @Schema(description = "用户ID",example = "1")
    private String id;

    @Schema(description = "用户名",example = "张三")
    private String name;

    @Schema(description = "用户名",example = "admin1")
    private String username;

    @Schema(description = "邮箱",example = "zhangsan@example.com")
    private String email;

    @Schema(description = "用户组ID",example = "1")
    private String groupId;

    @Schema(description = "用户组名称",example = "管理部")
    private String groupName;

    @Schema(description = "手机号",example = "13800000000")
    private String phone;

    @Schema(description = "状态",example = "1")
    private String status;

    @Schema(description = "创建时间",example = "2023-01-01 00:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ssXXX")
    private OffsetDateTime createTime;

    @Schema(description = "更新时间",example = "2023-01-01 00:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ssXXX")
    private OffsetDateTime updateTime;

    @Schema(description = "角色列表",example = "{'id':'1','name':'管理员'}")
    private Set<UserRoleBean> roles = new HashSet<>();

    @Schema(description = "权限列表",example = "{'admin','user'}")
    private Set<String> permissions = new HashSet<>();
}
