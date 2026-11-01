package com.orange.service.system.impl;

import com.orange.domain.common.BusinessException;
import com.orange.domain.common.PageData;
import com.orange.domain.login.resp.PermissionInfo;
import com.orange.domain.login.resp.RoleInfo;
import com.orange.domain.login.resp.UserInfo;
import com.orange.domain.system.user.req.AddUserReq;
import com.orange.domain.system.user.req.EditUserReq;
import com.orange.domain.system.user.req.QueryUserReq;
import com.orange.domain.system.user.resp.RoleBean;
import com.orange.domain.system.user.resp.UserBean;
import com.orange.entity.Group;
import com.orange.entity.Permission;
import com.orange.entity.Role;
import com.orange.entity.User;
import com.orange.repository.system.PermissionRepository;
import com.orange.repository.system.RoleRepository;
import com.orange.repository.system.UserRepository;
import com.orange.service.system.GroupService;
import com.orange.service.system.UserService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

import static com.orange.config.Constanst.STATUS_DISABLE;

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
    private GroupService groupService;

    private static final Set<String> USER_SORT_FIELDS =
            Set.of("id", "name", "username", "email", "status", "createTime", "updateTime");
    private static final Set<String> USER_FILTER_FIELDS =
            Set.of("name", "username", "email", "phone", "status");

    @Override
    public PageData<UserBean> queryUsers(QueryUserReq req) {
        String sortBy = req.getOrderField() != null && USER_SORT_FIELDS.contains(req.getOrderField())
                ? req.getOrderField() : "id";
        String sortDir = req.getOrderValue() == null ? "asc" : req.getOrderValue();
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())?
                Sort.by(sortBy).ascending(): Sort.by(sortBy).descending();

        Specification<User> spec = (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();
            String filterField = req.getFilterField();
            String filterValue = req.getFilterValue();

            if (filterField != null && !filterField.isBlank()) {
                if (!USER_FILTER_FIELDS.contains(filterField)) {
                    throw new BusinessException("不支持的过滤字段");
                }
                String keyword = filterValue == null ? "" : filterValue.toLowerCase();
                predicates.add(
                        cb.like(cb.lower(root.get(filterField)), keyword + "%")
                );
            }
            if(req.getGroupId()!=null&&!req.getGroupId().isEmpty()){
                predicates.add(
                        cb.like(cb.lower(root.get("groupId")), req.getGroupId().toLowerCase()+"%")
                );
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Pageable pageable = PageRequest.of(req.getPage()-1, req.getSize(), sort);
        Page<User>  pageUser = userRepository.findAll(spec, pageable);
        List<User> pageUserList = pageUser.getContent();
        // 一次加载组织名称，避免逐行查询造成 N+1
        Map<String, String> groupNameMap = groupService.queryGroups().stream()
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
        User user = new User();
        user.setName(req.getName());
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setGroupId(req.getGroupId());
        user.setPhone(req.getPhone());
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
        Optional<User> userOptional = userRepository.findById(req.getId());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (req.getName() != null) {
                user.setName(req.getName());
            }

            if (req.getUsername() != null) {
                user.setUsername(req.getUsername());
            }

            if (req.getEmail() != null) {
                user.setEmail(req.getEmail());
            }

            if (req.getGroupId() != null) {
                user.setGroupId(req.getGroupId());
            }

            if (req.getPhone() != null) {
                user.setPhone(req.getPhone());
            }

            if (req.getStatus() != null) {
                boolean disabling = !STATUS_DISABLE.equals(user.getStatus())
                        && STATUS_DISABLE.equals(req.getStatus());
                user.setStatus(req.getStatus());
                if (disabling) {
                    user.setTokenVersion(nextTokenVersion(user.getTokenVersion()));
                }
            }

            if (req.getRoles()!=null) {
                List<Role> roles = roleRepository.findAllById(req.getRoles());
                user.getRoles().clear();
                user.getRoles().addAll(roles);
            }

            if (req.getPermissions()!=null) {
                List<Permission> permissions = permissionRepository.findAllById(req.getPermissions());
                user.getPermissions().clear();
                user.getPermissions().addAll(permissions);
            }

            return user;
        }

        return null;
    }
    @Override
    @Transactional
    public void deleteUsers(List<String> ids) {
        List<User> list = userRepository.findAllById(ids);
        if(CollectionUtils.isEmpty(list)){
            throw new BusinessException("用户不存在");
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
        String tempPassword = generateTempPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true);
        // 密码被重置后，旧 token 必须立即失效
        user.setTokenVersion(nextTokenVersion(user.getTokenVersion()));
        userRepository.save(user);
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

    @Override
    public UserBean queryUser(String id) {
        User user = userRepository.findWithAllAttributesById(id);
        if (user==null) {
            return null;
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
            RoleBean roleBean = new RoleBean();
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
        User user = userRepository.findWithAllAttributesByUsername(username);
        if (user==null) {
            return null;
        }
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
        Set<Role> roles = user.getRoles();
        for (Role role : roles) {
            if (STATUS_DISABLE.equals(role.getStatus())) {
                continue;
            }
            RoleInfo roleInfo = new RoleInfo();
            roleInfo.setId(role.getId());
            roleInfo.setName(role.getName());
            userInfo.getRoles().add(roleInfo);
        }
        for (Role role : roles) {
            if (STATUS_DISABLE.equals(role.getStatus())) {
                continue;
            }
            for (Permission permission : role.getPermissions()) {
                if (STATUS_DISABLE.equals(permission.getStatus())) {
                    continue;
                }
                PermissionInfo permissionInfo = new PermissionInfo();
                permissionInfo.setRole(role.getId());
                permissionInfo.setType(permission.getType());
                permissionInfo.setPath(permission.getPath());
                permissionInfo.setAction(permission.getAction());
                userInfo.getRolePermissions().add(permissionInfo);
            }
        }
        for (Permission permission : user.getPermissions()) {
            if (STATUS_DISABLE.equals(permission.getStatus())) {
                continue;
            }
            PermissionInfo permissionInfo = new PermissionInfo();
            permissionInfo.setType(permission.getType());
            permissionInfo.setPath(permission.getPath());
            permissionInfo.setAction(permission.getAction());
            userInfo.getUserPermissions().add(permissionInfo);
        }
        return userInfo;
    }
}
