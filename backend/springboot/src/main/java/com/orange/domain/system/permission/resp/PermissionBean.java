package com.orange.domain.system.permission.resp;

import com.orange.entity.Permission;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Schema(description = "权限列表项")
@Data
public class PermissionBean {
    @Schema(description = "权限编码")
    private String id;

    @Schema(description = "权限名称")
    private String name;

    @Schema(description = "权限路径")
    private String path;

    @Schema(description = "权限操作")
    private String action;

    @Schema(description = "权限类型")
    private String type;

    @Schema(description = "权限状态")
    private String status;

    @Schema(description = "父权限编码")
    private String parentId;

    @Schema(description = "本地化名称，locale -> 名称")
    private Map<String, String> translations = new LinkedHashMap<>();

    @Schema(description = "创建时间")
    private OffsetDateTime createTime;

    @Schema(description = "更新时间")
    private OffsetDateTime updateTime;

    public static PermissionBean from(Permission permission) {
        return from(permission, Map.of());
    }

    public static PermissionBean from(Permission permission, Map<String, String> translations) {
        PermissionBean bean = new PermissionBean();
        bean.setId(permission.getId());
        bean.setName(permission.getName());
        bean.setPath(permission.getPath());
        bean.setAction(permission.getAction());
        bean.setType(permission.getType());
        bean.setStatus(permission.getStatus());
        bean.setParentId(permission.getParentId());
        bean.setTranslations(translations == null
                ? new LinkedHashMap<>()
                : new LinkedHashMap<>(translations));
        bean.setCreateTime(permission.getCreateTime());
        bean.setUpdateTime(permission.getUpdateTime());
        return bean;
    }
}
