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
        User user = userRepository.findWithAllAttributesByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
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
