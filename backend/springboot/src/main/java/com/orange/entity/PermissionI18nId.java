package com.orange.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 权限本地化名称的复合主键：permission_id + locale。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionI18nId implements Serializable {

    private static final long serialVersionUID = 1L;

    private String permissionId;

    private String locale;
}
