package com.orange.domain.system.user.resp;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.OffsetDateTime;

@Schema(description = "权限响应参数")
@Data
public class PermissionBean {
    @Schema(description = "权限ID",example = "1")
    private String id;

    @Schema(description = "权限名称",example = "用户管理")
    private String name;

    @Schema(description = "权限路径",example = "/user")
    private String path;

    @Schema(description = "权限操作",example = "list")
    private String action;

    @Schema(description = "权限类型",example = "menu")
    private String type;

    @Schema(description = "权限状态",example = "1")
    private String status;

    @Schema(description = "权限排序",example = "1")
    private Integer order;

    @Schema(description = "创建时间",example = "2023-08-01 10:00:00")
    private OffsetDateTime createTime;

    @Schema(description = "父权限ID",example = "00")
    private String parentId;
}
