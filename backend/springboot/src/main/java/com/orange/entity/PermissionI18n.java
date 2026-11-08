package com.orange.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "权限本地化名称实体")
@Entity
@Table(name = "sys_permission_i18n")
@IdClass(PermissionI18nId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionI18n {

    @Schema(description = "权限编码")
    @Id
    @Column(name = "permission_id", nullable = false, length = 64)
    private String permissionId;

    @Schema(description = "语言标签", example = "en")
    @Id
    @Column(name = "locale", nullable = false, length = 16)
    private String locale;

    @Schema(description = "本地化名称")
    @Column(name = "name", nullable = false, length = 255)
    private String name;
}
