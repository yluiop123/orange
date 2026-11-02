package com.orange.security.auth;

import com.orange.domain.common.BusinessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 防止低权限账号通过用户/角色编辑接口给自己或别人授予更高权限。
 * 规则保持简单：super 角色只能由 super 授予；直接权限只能授予自己已有的权限。
 */
@Component
public class GrantGuard {

    public void assertCanAssignRoles(Collection<String> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) {
            return;
        }
        if (roleIds.contains("super") && !isSuperAdmin()) {
            throw new BusinessException("只有超级管理员可以授予 super 角色");
        }
    }

    public void assertCanAssignPermissions(Collection<String> permissionIds) {
        if (permissionIds == null || permissionIds.isEmpty()) {
            return;
        }
        Set<String> authorities = currentAuthorities();
        for (String permissionId : permissionIds) {
            if (!authorities.contains(permissionId)) {
                throw new BusinessException("不能授予当前账号没有的权限");
            }
        }
    }

    public boolean isSuperAdmin() {
        return currentAuthorities().contains("ROLE_super");
    }

    public boolean hasAuthority(String authority) {
        return currentAuthorities().contains(authority);
    }

    private Set<String> currentAuthorities() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities() == null) {
            return Set.of();
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
    }
}
