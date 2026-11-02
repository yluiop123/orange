package com.orange.service.system.impl;

import com.orange.domain.common.BusinessException;
import com.orange.domain.system.permission.req.*;
import com.orange.entity.Permission;
import com.orange.repository.system.PermissionRepository;
import com.orange.repository.system.RoleRepository;
import com.orange.repository.system.UserRepository;
import com.orange.service.system.PermissionService;
import com.orange.util.QueryUtils;
import jakarta.persistence.criteria.Predicate;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.orange.config.Constanst.STATUS_ALL;
import static com.orange.config.Constanst.STATUS_ENABLE;

@Service
public class PermissionServiceImpl implements PermissionService {

    /** 根权限编码长度 */
    private static final int ROOT_CODE_LENGTH = 4;
    /** 每层子编码比父编码多出的位数 */
    private static final int CODE_SEGMENT_LENGTH = 2;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Permission> queryPermissions(QueryPermissionReq req) {
        Specification<Permission> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            String id = req.getId();
            String name = req.getName();
            String path = req.getPath();
            String status = req.getStatus();
            if (id!=null&&!id.isEmpty()) {
                predicates.add( cb.like(cb.lower(root.get("id")), QueryUtils.likePrefix(id), '\\'));
            }
            if (name!=null&&!name.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), QueryUtils.likePrefix(name), '\\'));
            }
            if (path!=null&&!path.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("path")), QueryUtils.likePrefix(path), '\\'));
            }
            if (status!=null&&!status.isEmpty()&&!STATUS_ALL.equals(status)) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        // 同级顺序由编码决定，删除无需重排
        return permissionRepository.findAll(spec, Sort.by("id"));
    }

    @Override
    @Transactional
    public void deletePermissions(List<String> ids) {
        List<Permission> all = permissionRepository.findAll();
        Map<String, Permission> byId = all.stream()
                .collect(Collectors.toMap(Permission::getId, permission -> permission));
        Set<String> requestedIds = new LinkedHashSet<>(ids);
        List<Permission> selected = requestedIds.stream()
                .map(byId::get)
                .filter(Objects::nonNull)
                .toList();
        if (selected.size() != requestedIds.size()) {
            throw new BusinessException("权限不存在");
        }

        Map<String, List<Permission>> childrenByParent = all.stream()
                .filter(permission -> permission.getParentId() != null)
                .collect(Collectors.groupingBy(Permission::getParentId));
        Set<String> subtreeIds = new LinkedHashSet<>();
        Deque<String> queue = new ArrayDeque<>(requestedIds);
        while (!queue.isEmpty()) {
            String id = queue.poll();
            if (subtreeIds.add(id)) {
                childrenByParent.getOrDefault(id, List.of())
                        .forEach(child -> queue.add(child.getId()));
            }
        }

        if (roleRepository.existsByPermissions_IdIn(subtreeIds)) {
            throw new BusinessException("权限已被角色引用，不能删除");
        }
        if (userRepository.existsByPermissions_IdIn(subtreeIds)) {
            throw new BusinessException("权限已被用户引用，不能删除");
        }

        // 先删深层节点，避免父子同时选中时父节点先删导致子节点找不到
        List<Permission> toDelete = all.stream()
                .filter(permission -> subtreeIds.contains(permission.getId()))
                .sorted(Comparator.comparingInt((Permission permission) -> permission.getId().length()).reversed())
                .toList();
        for (Permission permission : toDelete) {
            if (permissionRepository.existsById(permission.getId())) {
                permissionRepository.delete(permission);
                permissionRepository.flush();
            }
        }
    }

    @Override
    @Transactional
    public Permission addChild(AddChildPermissionReq req) {
        String id = req.getId();
        String parentId = StringUtils.trimToNull(req.getParentId());
        validateCode(id, parentId);
        if (permissionRepository.existsById(id)) {
            throw new BusinessException("权限编码已存在");
        }
        Permission parent = null;
        if (parentId != null) {
            parent = permissionRepository.findById(parentId)
                    .orElseThrow(() -> new BusinessException("父权限不存在"));
            if ("action".equals(parent.getType())) {
                throw new BusinessException("动作权限不能添加子节点");
            }
        }
        assertUniquePermission(req.getType(), req.getPath(), req.getAction(), null);
        Permission permission = new Permission();
        permission.setId(id);
        permission.setName(req.getName());
        permission.setPath(req.getPath());
        permission.setType(req.getType());
        permission.setAction(req.getAction());
        permission.setParentId(parent == null ? null : parent.getId());
        return permissionRepository.save(permission);
    }

    @Override
    @Transactional
    public Permission editPermission(EditPermissionReq req) {
        if (req.getId() == null) {
            throw new BusinessException("权限ID不能为空");
        }
        Optional<Permission> optionalPermission = permissionRepository.findById(req.getId());
        if(optionalPermission.isEmpty()){
            throw new BusinessException("权限不存在");
        }
        Permission permission = optionalPermission.get();
        String effectiveType = req.getType() != null ? req.getType() : permission.getType();
        String effectivePath = req.getPath() != null ? req.getPath() : permission.getPath();
        String effectiveAction = req.getAction() != null ? req.getAction() : permission.getAction();
        assertUniquePermission(effectiveType, effectivePath, effectiveAction, req.getId());
        if(req.getName()!=null){
            permission.setName(req.getName());
        }
        if(req.getPath()!=null){
            permission.setPath(req.getPath());
        }
        if(req.getAction()!=null){
            permission.setAction(req.getAction());
        }
        if(req.getType()!=null){
            permission.setType(req.getType());
        }
        if(req.getStatus()!=null){
            permission.setStatus(req.getStatus());
        }
        return permission;
    }

    @Override
    @Transactional(readOnly = true)
    public Permission queryPermission(String id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("权限不存在"));
    }
    @Override
    @Transactional(readOnly = true)
    public List<Permission> queryPermissions() {
        Specification<Permission> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), STATUS_ENABLE));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return permissionRepository.findAll(spec, Sort.by("id"));
    }

    /**
     * 权限编码即层级顺序：根编码 4 位，子编码 = 父编码 + 2 位数字。
     * 编码一旦创建不可修改，所以这里只做校验，不生成。
     */
    private void validateCode(String id, String parentId) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException("权限编码不能为空");
        }
        if (!id.matches("^[0-9]+$")) {
            throw new BusinessException("权限编码只能包含数字");
        }
        if (parentId == null) {
            if (id.length() != ROOT_CODE_LENGTH) {
                throw new BusinessException("根权限编码长度必须为" + ROOT_CODE_LENGTH);
            }
            return;
        }
        int expectedLength = parentId.length() + CODE_SEGMENT_LENGTH;
        if (id.length() != expectedLength) {
            throw new BusinessException("权限编码长度必须为" + expectedLength);
        }
        if (!id.startsWith(parentId)) {
            throw new BusinessException("权限编码必须以" + parentId + "开头");
        }
    }

    private void validatePermissionShape(String type, String action) {
        if ("action".equals(type)) {
            if (StringUtils.isBlank(action)) {
                throw new BusinessException("action 类型的权限必须填写 action");
            }
            return;
        }
        if ("menu".equals(type) || "directory".equals(type)) {
            if (StringUtils.isNotBlank(action)) {
                throw new BusinessException("menu/directory 类型的权限不能填写 action");
            }
        }
    }

    private void assertUniquePermission(String type, String path, String action, String excludeId) {
        validatePermissionShape(type, action);
        Specification<Permission> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("type"), type));
            predicates.add(cb.equal(root.get("path"), path));
            if (StringUtils.isBlank(action)) {
                predicates.add(cb.or(
                        cb.isNull(root.get("action")),
                        cb.equal(root.get("action"), "")
                ));
            } else {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (excludeId != null) {
                predicates.add(cb.notEqual(root.get("id"), excludeId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        if (permissionRepository.count(spec) > 0) {
            throw new BusinessException("权限已存在");
        }
    }
}
