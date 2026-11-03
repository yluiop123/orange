package com.orange.domain.system.group.resp;

import com.orange.entity.Group;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.OffsetDateTime;

@Schema(description = "组织列表项")
@Data
public class GroupBean {
    @Schema(description = "组织编码")
    private String id;

    @Schema(description = "组织名称")
    private String name;

    @Schema(description = "组织状态")
    private String status;

    @Schema(description = "父组织编码")
    private String parentId;

    @Schema(description = "创建时间")
    private OffsetDateTime createTime;

    @Schema(description = "更新时间")
    private OffsetDateTime updateTime;

    public static GroupBean from(Group group) {
        GroupBean bean = new GroupBean();
        bean.setId(group.getId());
        bean.setName(group.getName());
        bean.setStatus(group.getStatus());
        bean.setParentId(group.getParentId());
        bean.setCreateTime(group.getCreateTime());
        bean.setUpdateTime(group.getUpdateTime());
        return bean;
    }
}
