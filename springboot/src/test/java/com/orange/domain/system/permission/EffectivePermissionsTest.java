package com.orange.domain.system.permission;

import com.orange.entity.Permission;
import com.orange.entity.Role;
import com.orange.entity.User;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class EffectivePermissionsTest {

    @Test
    void mergesEnabledRolesAndDirectPermissionsAndSkipsDisabled() {
        Permission menu = permission("000500", "menu", "/system/user", null, "1");
        Permission action = permission("00050000", "action", "/system/user", "add", "1");
        Permission disabledAction = permission("00050001", "action", "/system/user", "delete", "0");
        Permission direct = permission("000001", "menu", "/profile", null, "1");

        Role role = new Role();
        role.setId("admin");
        role.setName("Admin");
        role.setStatus("1");
        role.setPermissions(Set.of(menu, action, disabledAction));

        Role disabledRole = new Role();
        disabledRole.setId("guest");
        disabledRole.setStatus("0");
        disabledRole.setPermissions(Set.of(permission("001", "menu", "/guest", null, "1")));

        User user = new User();
        user.setRoles(Set.of(role, disabledRole));
        user.setPermissions(Set.of(direct));

        EffectivePermissions effective = EffectivePermissions.of(user);

        assertThat(effective.roles()).extracting(Role::getId).containsExactly("admin");
        assertThat(effective.rolePermissions())
                .extracting(EffectivePermissions.RolePermission::roleId)
                .containsOnly("admin");
        assertThat(effective.directPermissions()).extracting(Permission::getId)
                .containsExactly("000001");
        assertThat(effective.authorities()).contains(
                "000500",
                "menu#/system/user",
                "00050000",
                "action#/system/user:add",
                "000001",
                "menu#/profile");
        assertThat(effective.authorities()).doesNotContain(
                "00050001",
                "action#/system/user:delete",
                "001",
                "menu#/guest");
    }

    @Test
    void authorityFormatMatchesControllerAnnotations() {
        Permission menu = permission("000500", "menu", "/system/user", null, "1");
        Permission action = permission("00050000", "action", "/system/user", "add", "1");

        assertThat(EffectivePermissions.authorityOf(menu)).isEqualTo("menu#/system/user");
        assertThat(EffectivePermissions.authorityOf(action)).isEqualTo("action#/system/user:add");
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
