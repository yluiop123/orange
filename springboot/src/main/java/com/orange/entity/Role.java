package com.orange.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Schema(description = "角色实体")
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name="sys_role")
@Data
@EqualsAndHashCode(exclude = {"users", "permissions"})
public class Role {
    @Schema(description = "角色编码")
    @Id
    @Column(name = "id")
    private String id;

    @Schema(description = "角色名称")
    @Column(name = "name")
    private String name;

    @Schema(description = "角色状态",example = "1")
    @Column(name = "status")
    private String status = "1";

    @Schema(description = "乐观锁版本", example = "0")
    @Version
    @Column(name = "version")
    private Integer version = 0;

    @Schema(description = "创建时间",example = "2023-01-01 00:00:00")
    @Column(name = "create_time")
    @CreationTimestamp
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ssXXX")
    private OffsetDateTime createTime;

    @Schema(description = "更新时间",example = "2023-01-01 00:00:00")
    @Column(name = "update_time")
    @UpdateTimestamp
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ssXXX")
    private OffsetDateTime updateTime;

    @Schema(description = "创建人")
    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @Schema(description = "更新人")
    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;

//    @OneToMany(mappedBy = "role", fetch = FetchType.LAZY)
//    @JsonIgnore
//    private List<UserRole> userRoles;
//
//    @OneToMany(mappedBy = "role", fetch = FetchType.LAZY)
//    @JsonIgnore
//    @ToString.Exclude
//    private List<RolePermission> rolePermissions;
    @Schema(description = "用户列表")
    @ManyToMany(mappedBy = "roles", fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    private Set<User> users = new HashSet<>();

    @Schema(description = "权限列表")
    @ManyToMany(fetch = FetchType.LAZY,cascade = CascadeType.PERSIST)
    @JoinTable(
            name = "sys_role_permission",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    @JsonIgnore
    @ToString.Exclude
    private Set<Permission> permissions = new HashSet<>();
}
