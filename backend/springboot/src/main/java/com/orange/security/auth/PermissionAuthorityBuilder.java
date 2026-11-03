package com.orange.security.auth;

import com.orange.domain.system.permission.EffectivePermissions;
import com.orange.entity.Role;
import com.orange.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 把 EffectivePermissions 转成 Spring Security 的 authority 列表。
 * 过滤规则只在 EffectivePermissions 里实现一次。
 */
@Component
public class PermissionAuthorityBuilder {

    private static final String ROLE_PREFIX = "ROLE_";

    public List<GrantedAuthority> build(User user) {
        EffectivePermissions effective = EffectivePermissions.of(user);
        List<GrantedAuthority> authorities = new ArrayList<>();

        for (Role role : effective.roles()) {
            authorities.add(new SimpleGrantedAuthority(ROLE_PREFIX + role.getId()));
        }
        for (String permission : effective.authorities()) {
            authorities.add(new SimpleGrantedAuthority(permission));
        }
        return authorities;
    }
}
