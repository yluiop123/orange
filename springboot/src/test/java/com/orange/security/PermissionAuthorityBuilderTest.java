package com.orange.security;

import com.orange.entity.Permission;
import com.orange.entity.Role;
import com.orange.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PermissionAuthorityBuilderTest {

    private final PermissionAuthorityBuilder builder = new PermissionAuthorityBuilder();

    @Test
    void buildsRoleAndPermissionAuthoritiesAndSkipsDisabled() {
        Permission menu = permission("000500", "menu", "/system/user", null, "1");
        Permission action = permission("00050000", "action", "/system/user", "add", "1");
        Permission disabledAction = permission("00050001", "action", "/system/user", "delete", "0");

        Role role = new Role();
        role.setId("admin");
        role.setStatus("1");
        role.setPermissions(Set.of(menu, action, disabledAction));

        Role disabledRole = new Role();
        disabledRole.setId("guest");
        disabledRole.setStatus("0");
        disabledRole.setPermissions(Set.of(permission("100", "menu", "/guest", null, "1")));

        User user = new User();
        user.setRoles(Set.of(role, disabledRole));
        user.setPermissions(Set.of());

        List<String> authorities = builder.build(user).stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        assertTrue(authorities.contains("ROLE_admin"));
        assertFalse(authorities.contains("ROLE_guest"));
        assertTrue(authorities.contains("000500"));
        assertTrue(authorities.contains("menu#/system/user"));
        assertTrue(authorities.contains("action#/system/user:add"));
        assertFalse(authorities.contains("action#/system/user:delete"));
        assertFalse(authorities.contains("100"));
    }

    private Permission permission(String id, String type, String path, String action, String status) {
        Permission permission = new Permission();
        permission.setId(id);
        permission.setType(type);
        permission.setPath(path);
        permission.setAction(action);
        permission.setStatus(status);
        return permission;
    }
}
