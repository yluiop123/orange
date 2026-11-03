package com.orange.service.system.impl;

import com.orange.domain.common.BusinessException;
import com.orange.domain.common.PageData;
import com.orange.domain.login.resp.PermissionInfo;
import com.orange.domain.login.resp.RoleInfo;
import com.orange.domain.login.resp.UserInfo;
import com.orange.domain.system.permission.EffectivePermissions;
import com.orange.domain.system.user.req.AddUserReq;
import com.orange.domain.system.user.req.EditUserReq;
import com.orange.domain.system.user.req.QueryUserReq;
import com.orange.domain.system.user.resp.UserRoleBean;
import com.orange.domain.system.user.resp.UserBean;
import com.orange.entity.Group;
import com.orange.entity.Permission;
import com.orange.entity.Role;
import com.orange.entity.User;
import com.orange.repository.system.GroupRepository;
import com.orange.repository.system.PermissionRepository;
import com.orange.repository.system.RoleRepository;
import com.orange.repository.system.UserRepository;
import com.orange.security.auth.GrantGuard;
import com.orange.security.auth.LoginAttemptService;
import com.orange.security.jwt.AuthUser;
import com.orange.service.system.GroupService;
import com.orange.service.system.UserService;
import com.orange.util.QueryUtils;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

import static com.orange.config.Constanst.STATUS_ALL;
import static com.orange.config.Constanst.STATUS_DISABLE;
import static com.orange.config.Constanst.STATUS_ENABLE;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    PasswordEncoder passwordEncoder;
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupService groupService;

    @Autowired
    private GrantGuard grantGuard;

    @Autowired
    private LoginAttemptService loginAttemptService;

    private static final Set<String> USER_SORT_FIELDS =
            Set.of("id", "name", "username", "email", "status", "createTime", "updateTime");
    private static final Set<String> USER_FILTER_FIELDS =
            Set.of("name", "username", "email", "phone", "status");

    @Override
    @Transactional(readOnly = true)
    public PageData<UserBean> queryUsers(QueryUserReq req) {
        String requestedSort = req.getSort() != null ? req.getSort() : req.getOrderField();
        boolean explicitSort = requestedSort != null && USER_SORT_FIELDS.contains(requestedSort);
        // 默认按创建时间倒序，新增用户回到第 1 页即可看到
        String sortBy = explicitSort ? requestedSort : "createTime";
        String requestedDirection = req.getDirection() != null ? req.getDirection() : req.getOrderValue();
        String sortDir = requestedDirection == null || requestedDirection.isBlank()
                ? (explicitSort ? "asc" : "desc")
                : requestedDirection;
        if (!sortDir.equalsIgnoreCase("asc") && !sortDir.equalsIgnoreCase("desc")) {
            throw new BusinessException("排序方向只能是 asc 或 desc");
        }
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())?
                Sort.by(sortBy).ascending(): Sort.by(sortBy).descending();

        Specification<User> spec = (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();
            String keyword = req.getKeyword();
            if (keyword != null && !keyword.isBlank()) {
                String pattern = QueryUtils.likePrefix(keyword);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern, '\\'),
                        cb.like(cb.lower(root.get("username")), pattern, '\\'),
                        cb.like(cb.lower(root.get("email")), pattern, '\\'),
                        cb.like(cb.lower(root.get("phone")), pattern, '\\')
                ));
            }
            // 旧版单字段过滤，保留兼容
            String filterField = req.getFilterField();
            String filterValue = req.getFilterValue();
            if (filterField != null && !filterField.isBlank()) {
                if (!USER_FILTER_FIELDS.contains(filterField)) {
                    throw new BusinessException("不支持的过滤字段");
                }
                String legacyKeyword = filterValue == null ? "" : filterValue;
                predicates.add(
                        cb.like(cb.lower(root.get(filterField)), QueryUtils.likePrefix(legacyKeyword), '\\')
                );
            }
            if (req.getStatus() != null && !req.getStatus().isBlank()
                    && !STATUS_ALL.equals(req.getStatus())) {
                predicates.add(cb.equal(root.get("status"), req.getStatus()));
            }
            if (req.getGroupId() != null && !req.getGroupId().isEmpty()) {
                predicates.add(
                        cb.like(cb.lower(root.get("groupId")), QueryUtils.likePrefix(req.getGroupId()), '\\')
                );
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Pageable pageable = PageRequest.of(req.getPage()-1, req.getSize(), sort);
        Page<User>  pageUser = userRepository.findAll(spec, pageable);
        List<User> pageUserList = pageUser.getContent();
        // 一次加载组织名称，避免逐行查询造成 N+1；不过滤状态，禁用组织的名称也要显示
        Map<String, String> groupNameMap = groupRepository.findAll().stream()
                .collect(Collectors.toMap(
                        Group::getId,
                        group -> group.getName() == null ? "" : group.getName(),
                        (existing, replacement) -> existing
                ));
        List<UserBean> userBeanList = pageUserList.stream().map(user -> {
            UserBean userBean = new UserBean();
            userBean.setId(user.getId());
            userBean.setName(user.getName());
            userBean.setUsername(user.getUsername());
            userBean.setEmail(user.getEmail());
            userBean.setGroupId(user.getGroupId());
            String groupName = groupNameMap.getOrDefault(user.getGroupId(), "");
            userBean.setGroupName(groupName);
            userBean.setPhone(user.getPhone());
            userBean.setStatus(user.getStatus());
            userBean.setCreateTime(user.getCreateTime());
            userBean.setUpdateTime(user.getUpdateTime());
            return userBean;
        }).collect(Collectors.toList());
        return new PageData<>(pageUser.getTotalElements(), userBeanList,
                req.getPage(), req.getSize(), pageUser.getTotalPages());
    }

    @Override
    @Transactional
    public String addUser(AddUserReq req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new BusinessException("用户名已存在");
        }
        grantGuard.assertCanAssignRoles(req.getRoles());
        grantGuard.assertCanAssignPermissions(req.getPermissions());
        if (!groupRepository.existsById(req.getGroupId())) {
            throw new BusinessException("组织不存在");
        }
        User user = new User();
        user.setName(req.getName());
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setGroupId(req.getGroupId());
        user.setPhone(req.getPhone());
        user.setStatus(req.getStatus() == null ? STATUS_ENABLE : req.getStatus());
        String tempPassword = generateTempPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true);
        List<Role> roles = req.getRoles() == null ? List.of() : roleRepository.findAllById(req.getRoles());
        user.getRoles().addAll(roles);
        List<Permission> permissions = req.getPermissions() == null ? List.of() : permissionRepository.findAllById(req.getPermissions());
        user.getPermissions().addAll(permissions);
        userRepository.save(user);
        return tempPassword;
    }
    @Override
    @Transactional
    public User editUser(EditUserReq req) {
        if (req.getId() == null) {
            throw new BusinessException("用户ID不能为空");
        }
        Optional<User> userOptional = userRepository.findById(req.getId());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (req.getName() != null) {
                user.setName(req.getName());
            }

            if (req.getUsername() != null && !req.getUsername().equals(user.getUsername())) {
                throw new BusinessException("用户名创建后不可修改");
            }

            if (req.getEmail() != null) {
                user.setEmail(req.getEmail());
            }

            if (req.getGroupId() != null) {
                if (req.getGroupId().isBlank() || !groupRepository.existsById(req.getGroupId())) {
                    throw new BusinessException("组织不存在");
                }
                user.setGroupId(req.getGroupId());
            }

            if (req.getPhone() != null) {
                user.setPhone(req.getPhone());
            }

            if (req.getStatus() != null) {
                boolean disabling = !STATUS_DISABLE.equals(user.getStatus())
                        && STATUS_DISABLE.equals(req.getStatus());
                if (disabling) {
                    assertNotSelf(user.getId(), "禁用");
                    assertNotLastSuper(user, "禁用");
                }
                user.setStatus(req.getStatus());
                if (disabling) {
                    user.setTokenVersion(nextTokenVersion(user.getTokenVersion()));
                }
            }

            if (req.getRoles()!=null) {
                grantGuard.assertCanAssignRoles(req.getRoles());
                List<Role> roles = roleRepository.findAllById(req.getRoles());
                user.getRoles().clear();
                user.getRoles().addAll(roles);
            }

            if (req.getPermissions()!=null) {
                grantGuard.assertCanAssignPermissions(req.getPermissions());
                List<Permission> permissions = permissionRepository.findAllById(req.getPermissions());
                user.getPermissions().clear();
                user.getPermissions().addAll(permissions);
            }

            return user;
        }

        throw new BusinessException("用户不存在");
    }
    @Override
    @Transactional
    public void deleteUsers(List<String> ids) {
        List<User> list = userRepository.findAllById(ids);
        if(CollectionUtils.isEmpty(list)){
            throw new BusinessException("用户不存在");
        }
        long enabledSupers = userRepository.countByRoles_IdAndStatus("super", STATUS_ENABLE);
        long deletingSupers = list.stream()
                .filter(user -> !STATUS_DISABLE.equals(user.getStatus()) && hasRole(user, "super"))
                .count();
        if (deletingSupers > 0 && enabledSupers - deletingSupers < 1) {
            throw new BusinessException("系统至少需要保留一个启用的超级管理员");
        }
        for (User user : list) {
            assertNotSelf(user.getId(), "删除");
        }
        // 删除用户前先清理角色/权限关联，避免“有角色就永远删不掉”
        for (User user : list) {
            user.getRoles().clear();
            user.getPermissions().clear();
        }
        userRepository.deleteAll(list);
    }

    @Override
    @Transactional
    public String resetUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        if (hasRole(user, "super") && !grantGuard.isSuperAdmin()) {
            throw new BusinessException("无权重置超级管理员密码");
        }
        String tempPassword = generateTempPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true);
        // 密码被重置后，旧 token 必须立即失效
        user.setTokenVersion(nextTokenVersion(user.getTokenVersion()));
        userRepository.save(user);
        loginAttemptService.clearUserAttempts(user.getUsername());
        return tempPassword;
    }

    @Override
    @Transactional
    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BusinessException("原密码错误");
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new BusinessException("新密码不能与原密码相同");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        // 修改密码后让旧 token 失效，要求重新登录
        user.setTokenVersion(nextTokenVersion(user.getTokenVersion()));
        userRepository.save(user);
        loginAttemptService.clearUserAttempts(user.getUsername());
    }

    private static final String PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

    private String generateTempPassword() {
        SecureRandom random = new SecureRandom();
        StringBuilder builder = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            builder.append(PASSWORD_CHARS.charAt(random.nextInt(PASSWORD_CHARS.length())));
        }
        return builder.toString();
    }

    @Override
    @Transactional
    public void revokeTokens(String username) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.setTokenVersion(nextTokenVersion(user.getTokenVersion()));
        }
    }

    private int nextTokenVersion(Integer current) {
        return (current == null ? 0 : current) + 1;
    }

    private String currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthUser authUser) {
            return authUser.getUserId();
        }
        return null;
    }

    private boolean hasRole(User user, String roleId) {
        return user.getRoles().stream().anyMatch(role -> roleId.equals(role.getId()));
    }

    private void assertNotSelf(String targetId, String action) {
        if (targetId != null && targetId.equals(currentUserId())) {
            throw new BusinessException("不能" + action + "当前登录用户");
        }
    }

    private void assertNotLastSuper(User user, String action) {
        if (!hasRole(user, "super") || STATUS_DISABLE.equals(user.getStatus())) {
            return;
        }
        long enabledSupers = userRepository.countByRoles_IdAndStatus("super", STATUS_ENABLE);
        if (enabledSupers <= 1) {
            throw new BusinessException("系统至少需要保留一个启用的超级管理员，不能" + action);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserBean queryUser(String id) {
        User user = userRepository.findWithAllAttributesById(id);
        if (user==null) {
            throw new BusinessException("用户不存在");
        }
        Group group = groupService.queryGroup(user.getGroupId());
        UserBean userBean = new UserBean();
        userBean.setId(user.getId());
        userBean.setName(user.getName());
        userBean.setUsername(user.getUsername());
        userBean.setEmail(user.getEmail());
        userBean.setGroupId(user.getGroupId());
        userBean.setGroupName(group.getName());
        userBean.setPhone(user.getPhone());
        userBean.setStatus(user.getStatus());
        userBean.setCreateTime(user.getCreateTime());
        userBean.setUpdateTime(user.getUpdateTime());
        Set<Role> roles = user.getRoles();
        for (Role role : roles) {
            UserRoleBean roleBean = new UserRoleBean();
            roleBean.setId(role.getId());
            roleBean.setName(role.getName());
            userBean.getRoles().add(roleBean);
        }
        for (Permission permission : user.getPermissions()) {
            userBean.getPermissions().add(permission.getId());
        }
        return userBean;
    }

    @Override
    @Transactional(readOnly = true)
    public UserInfo queryUserInfo(String username) {
        // 分成两次查询，避免角色权限和直属权限的笛卡尔积。
        User user = userRepository.findWithRolesByUsername(username);
        if (user==null) {
            throw new BusinessException("用户不存在");
        }
        userRepository.findWithPermissionsByUsername(username);
        Group group = groupService.queryGroup(user.getGroupId());
        UserInfo userInfo = new UserInfo();
        userInfo.setId(user.getId());
        userInfo.setName(user.getName());
        userInfo.setUsername(user.getUsername());
        userInfo.setEmail(user.getEmail());
        userInfo.setGroupId(user.getGroupId());
        userInfo.setGroupName(group.getName());
        userInfo.setPhone(user.getPhone());
        userInfo.setStatus(user.getStatus());
        userInfo.setMustChangePassword(Boolean.TRUE.equals(user.getMustChangePassword()));
        userInfo.setCreateTime(user.getCreateTime());
        userInfo.setUpdateTime(user.getUpdateTime());
        EffectivePermissions effective = EffectivePermissions.of(user);
        for (Role role : effective.roles()) {
            RoleInfo roleInfo = new RoleInfo();
            roleInfo.setId(role.getId());
            roleInfo.setName(role.getName());
            userInfo.getRoles().add(roleInfo);
        }
        for (EffectivePermissions.RolePermission item : effective.rolePermissions()) {
            Permission permission = item.permission();
            PermissionInfo permissionInfo = new PermissionInfo();
            permissionInfo.setRole(item.roleId());
            permissionInfo.setType(permission.getType());
            permissionInfo.setPath(permission.getPath());
            permissionInfo.setAction(permission.getAction());
            userInfo.getRolePermissions().add(permissionInfo);
        }
        for (Permission permission : effective.directPermissions()) {
            PermissionInfo permissionInfo = new PermissionInfo();
            permissionInfo.setType(permission.getType());
            permissionInfo.setPath(permission.getPath());
            permissionInfo.setAction(permission.getAction());
            userInfo.getUserPermissions().add(permissionInfo);
        }
        return userInfo;
    }
}
