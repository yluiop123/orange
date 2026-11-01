package com.orange.security;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.orange.entity.Permission;
import com.orange.entity.Role;
import com.orange.repository.system.UserRepository;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.orange.config.Constanst.STATUS_DISABLE;

@Service
public class JwtUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // create a user for "randomuser123"/"password".
        com.orange.entity.User user = userRepository.findByUsername(username);
        if (user==null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        } else {
            Set<Role> roles = user.getRoles();
            Set<String> permissions = new HashSet<>();
            for (Role role : roles) {
                for (Permission permission : role.getPermissions()) {
                    permissions.addAll(getPermissionStrs(permission));
                }
            }
            for (Permission permission : user.getPermissions()) {
                permissions.addAll(getPermissionStrs(permission));
            }

            List<GrantedAuthority> authorities = new ArrayList<>();
            for (Role role : roles) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getId()));
            }
            for (String permission : permissions) {
                authorities.add(new SimpleGrantedAuthority(permission));
            }
            int tokenVersion = user.getTokenVersion() == null ? 0 : user.getTokenVersion();
            return new AuthUser(
                    user.getId(),
                    username,
                    user.getPassword(),
                    !STATUS_DISABLE.equals(user.getStatus()),
                    authorities,
                    tokenVersion,
                    Boolean.TRUE.equals(user.getMustChangePassword()));
        }
    }

    private Set<String> getPermissionStrs(Permission permission) {
        Set<String> permissions = new HashSet<>();
        String id = permission.getId();
        permissions.add(id);

        String type = permission.getType();
        String path = permission.getPath();
        String action = permission.getAction();
        String permissionStr = type+"#"+path;
        if (StringUtils.isNotBlank(action)) {
            permissionStr+=":"+action;
        }
        permissions.add(permissionStr);
        return permissions;
    }
}
