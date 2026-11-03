package com.orange.domain.system.permission;

import com.orange.entity.Permission;
import com.orange.entity.Role;
import com.orange.entity.User;
import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static com.orange.config.Constanst.STATUS_DISABLE;

/**
 * 当前用户的有效权限：启用的角色并集 + 直属权限，再减去停用权限。
 * Spring authorities 和 /auth/user-info 都从这里派生，避免两套过滤规则。
 */
public record EffectivePermissions(
        List<Role> roles,
        List<RolePermission> rolePermissions,
        List<Permission> directPermissions,
        Set<Permission> permissions,
        Set<String> authorities) {

    public record RolePermission(String roleId, Permission permission) {
    }

    public static EffectivePermissions of(User user) {
        List<Role> activeRoles = user.getRoles().stream()
                .filter(role -> !STATUS_DISABLE.equals(role.getStatus()))
                .toList();

        List<RolePermission> rolePermissions = new ArrayList<>();
        for (Role role : activeRoles) {
            for (Permission permission : role.getPermissions()) {
                if (!STATUS_DISABLE.equals(permission.getStatus())) {
                    rolePermissions.add(new RolePermission(role.getId(), permission));
                }
            }
        }

        List<Permission> directPermissions = user.getPermissions().stream()
                .filter(permission -> !STATUS_DISABLE.equals(permission.getStatus()))
                .toList();

        Set<Permission> permissions = new LinkedHashSet<>();
        rolePermissions.forEach(item -> permissions.add(item.permission()));
        permissions.addAll(directPermissions);

        Set<String> authorities = new LinkedHashSet<>();
        for (Permission permission : permissions) {
            authorities.add(permission.getId());
            authorities.add(authorityOf(permission));
        }

        return new EffectivePermissions(
                activeRoles, rolePermissions, directPermissions, permissions, authorities);
    }

    public static String authorityOf(Permission permission) {
        StringBuilder authority = new StringBuilder()
                .append(permission.getType())
                .append('#')
                .append(permission.getPath());
        if (StringUtils.isNotBlank(permission.getAction())) {
            authority.append(':').append(permission.getAction());
        }
        return authority.toString();
    }
}
