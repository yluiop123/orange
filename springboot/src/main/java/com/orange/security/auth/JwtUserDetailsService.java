package com.orange.security.auth;

import com.orange.entity.User;
import com.orange.repository.system.UserRepository;
import com.orange.security.jwt.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.orange.config.Constanst.STATUS_DISABLE;

@Service
@RequiredArgsConstructor
public class JwtUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PermissionAuthorityBuilder authorityBuilder;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 分成两次查询：角色权限和直属权限都是多值集合，放在同一个 EntityGraph 里会笛卡尔积。
        User user = userRepository.findWithRolesByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
        userRepository.findWithPermissionsByUsername(username);
        int tokenVersion = user.getTokenVersion() == null ? 0 : user.getTokenVersion();
        return new AuthUser(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                !STATUS_DISABLE.equals(user.getStatus()),
                authorityBuilder.build(user),
                tokenVersion,
                Boolean.TRUE.equals(user.getMustChangePassword()));
    }
}
