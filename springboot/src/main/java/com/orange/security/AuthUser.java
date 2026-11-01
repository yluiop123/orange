package com.orange.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

/**
 * 在标准 UserDetails 基础上携带用户 ID、token 版本号和强制改密标记。
 * 修改密码、禁用用户、登出时递增版本，使旧 token 失效。
 */
public class AuthUser extends User {

    private final String userId;
    private final int tokenVersion;
    private final boolean mustChangePassword;

    public AuthUser(String userId,
                    String username,
                    String password,
                    boolean enabled,
                    Collection<? extends GrantedAuthority> authorities,
                    int tokenVersion,
                    boolean mustChangePassword) {
        super(username, password, enabled, true, true, true, authorities);
        this.userId = userId;
        this.tokenVersion = tokenVersion;
        this.mustChangePassword = mustChangePassword;
    }

    public String getUserId() {
        return userId;
    }

    public int getTokenVersion() {
        return tokenVersion;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }
}
