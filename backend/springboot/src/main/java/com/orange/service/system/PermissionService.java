package com.orange.service.system;

import com.orange.domain.system.permission.req.*;
import com.orange.entity.Permission;

import java.util.List;
import java.util.Map;

public interface PermissionService {
    List<Permission> queryPermissions(QueryPermissionReq req);
    void deletePermissions(List<String> id);
    Permission addChild(AddChildPermissionReq user);
    Permission editPermission(EditPermissionReq user);
    Permission queryPermission(String id);
    List<Permission> queryPermissions();

    /** 单个权限的翻译：locale -> 本地化名称。 */
    Map<String, String> queryTranslations(String permissionId);

    /** 批量查询翻译：permissionId -> (locale -> 本地化名称)。 */
    Map<String, Map<String, String>> queryTranslations(List<String> permissionIds);
}
