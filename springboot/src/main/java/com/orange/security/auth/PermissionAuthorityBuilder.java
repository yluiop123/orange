package com.orange.security.auth;

import com.orange.entity.Permission;
import com.orange.entity.Role;
import com.orange.entity.User;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static com.orange.config.Constanst.STATUS_DISABLE;

/**
 * 把用户、角色和权限统一转换为 Spring Security authority。
 * 禁用角色和禁用权限在入口处就被排除。
 */
@Component
public class PermissionAuthorityBuilder {

    private static final String ROLE_PREFIX = "ROLE_";
    private static final String AUTHORITY_SEPARATOR = "#";
    private static final String ACTION_SEPARATOR = ":";

    public List<GrantedAuthority> build(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        Set<String> permissions = new LinkedHashSet<>();

        for (Role role : user.getRoles()) {
            if (STATUS_DISABLE.equals(role.getStatus())) {
                continue;
            }
            authorities.add(new SimpleGrantedAuthority(ROLE_PREFIX + role.getId()));
            collectPermissions(role.getPermissions(), permissions);
        }
        collectPermissions(user.getPermissions(), permissions);

        for (String permission : permissions) {
            authorities.add(new SimpleGrantedAuthority(permission));
        }
        return authorities;
    }

    private void collectPermissions(Set<Permission> source, Set<String> target) {
        for (Permission permission : source) {
            if (STATUS_DISABLE.equals(permission.getStatus())) {
                continue;
            }
            target.add(permission.getId());
            target.add(toAuthority(permission));
        }
    }

    static String toAuthority(Permission permission) {
        StringBuilder authority = new StringBuilder()
                .append(permission.getType())
                .append(AUTHORITY_SEPARATOR)
                .append(permission.getPath());
        if (StringUtils.isNotBlank(permission.getAction())) {
            authority.append(ACTION_SEPARATOR).append(permission.getAction());
        }
        return authority.toString();
    }
}
