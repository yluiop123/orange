package com.orange.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Schema(description = "用户组实体")
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name="sys_group")
@Data
public class Group {
    @Schema(description = "组织编码")
    @Id
    @Column(name = "id")
    private String id;

    @Schema(description = "组织名称")
    @Column(name = "name")
    private String name;

    @Schema(description = "组织排序")
    @Column(name = "order_num")
    private Integer order;

    @Schema(description = "组织状态")
    @Column(name = "status")
    private String status = "1";

    @Schema(description = "乐观锁版本", example = "0")
    @Version
    @Column(name = "version")
    private Integer version = 0;

    @Schema(description = "创建时间")
    @Column(name = "create_time")
    @CreationTimestamp
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ssXXX")
    private OffsetDateTime createTime;

    @Schema(description = "更新时间")
    @Column(name = "update_time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ssXXX")
    @UpdateTimestamp
    private OffsetDateTime updateTime;

    @Schema(description = "创建人")
    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @Schema(description = "更新人")
    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;

    @Schema(description = "父组织编码")
    @Column(name = "parent_id")
    private String parentId;
}
