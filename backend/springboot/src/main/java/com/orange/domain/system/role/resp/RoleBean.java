package com.orange.domain.system.role.resp;

import com.orange.entity.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Schema(description = "角色详情")
@Data
public class RoleBean {
    @Schema(description = "角色名称")
    private String name;

    @Schema(description = "角色ID")
    private String id;

    @Schema(description = "角色状态", example = "1")
    private String status;

    @Schema(description = "权限列表")
    private List<String> permissions;

    @Schema(description = "创建时间")
    private OffsetDateTime createTime;

    @Schema(description = "更新时间")
    private OffsetDateTime updateTime;

    /** 列表场景不加载权限集合，避免额外查询。 */
    public static RoleBean from(Role role) {
        RoleBean bean = new RoleBean();
        bean.setId(role.getId());
        bean.setName(role.getName());
        bean.setStatus(role.getStatus());
        bean.setCreateTime(role.getCreateTime());
        bean.setUpdateTime(role.getUpdateTime());
        return bean;
    }
}
