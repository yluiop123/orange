package com.orange.service.system.impl;

import com.orange.domain.common.BusinessException;
import com.orange.domain.system.permission.req.*;
import com.orange.domain.system.permission.policy.PermissionShapePolicy;
import com.orange.domain.system.tree.TreeCodePolicy;
import com.orange.domain.system.tree.TreeIndex;
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

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import static com.orange.config.Constanst.STATUS_ALL;
import static com.orange.config.Constanst.STATUS_DISABLE;
import static com.orange.config.Constanst.STATUS_ENABLE;

@Service
public class PermissionServiceImpl implements PermissionService {

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
            String type = req.getType();
            if (type!=null&&!type.isEmpty()&&!STATUS_ALL.equals(type)) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        // 同级顺序由编码决定，删除无需重排
        boolean textFilter = StringUtils.isNotBlank(req.getId())
                || StringUtils.isNotBlank(req.getName())
                || StringUtils.isNotBlank(req.getPath())
                || (StringUtils.isNotBlank(req.getType()) && !STATUS_ALL.equals(req.getType()));
        List<Permission> matched = permissionRepository.findAll(spec, Sort.by("id"));
        return textFilter ? includeAncestors(matched, permissionRepository.findAll()) : matched;
    }

    @Override
    @Transactional
    public void deletePermissions(List<String> ids) {
        List<Permission> all = permissionRepository.findAll();
        TreeIndex<Permission> index = TreeIndex.of(
                all, Permission::getId, Permission::getParentId);
        Set<String> requestedIds = new LinkedHashSet<>(ids);
        List<Permission> selected = requestedIds.stream()
                .map(index::get)
                .filter(Objects::nonNull)
                .toList();
        if (selected.size() != requestedIds.size()) {
            throw new BusinessException("权限不存在");
        }

        Set<String> subtreeIds = index.subtreeIds(requestedIds);
        if (roleRepository.existsByPermissions_IdIn(subtreeIds)) {
            throw new BusinessException("权限已被角色引用，不能删除");
        }
        if (userRepository.existsByPermissions_IdIn(subtreeIds)) {
            throw new BusinessException("权限已被用户引用，不能删除");
        }

        // 先删深层节点，避免父子同时选中时父节点先删导致子节点找不到
        for (Permission permission : index.deleteOrder(subtreeIds)) {
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
        TreeCodePolicy.PERMISSION.validate(id, parentId);
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
            boolean disabling = !STATUS_DISABLE.equals(permission.getStatus())
                    && STATUS_DISABLE.equals(req.getStatus());
            if (disabling) {
                assertNoEnabledDescendants(permission.getId());
            }
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
     * 禁用父节点前要求先禁用子节点，避免“父节点隐藏、子节点仍然生效”的中间状态。
     */
    private void assertNoEnabledDescendants(String id) {
        TreeIndex<Permission> index = TreeIndex.of(
                permissionRepository.findAll(), Permission::getId, Permission::getParentId);
        if (index.hasEnabledDescendant(id,
                permission -> STATUS_ENABLE.equals(permission.getStatus()))) {
            throw new BusinessException("请先禁用子权限");
        }
    }

    /** 文本筛选时把祖先一并返回，前端才能保持树的层级。 */
    private List<Permission> includeAncestors(List<Permission> matched, List<Permission> all) {
        TreeIndex<Permission> index = TreeIndex.of(
                all, Permission::getId, Permission::getParentId);
        Set<String> ids = index.withAncestorIds(matched);
        return all.stream()
                .filter(permission -> ids.contains(permission.getId()))
                .sorted(Comparator.comparing(Permission::getId))
                .toList();
    }

    private void assertUniquePermission(String type, String path, String action, String excludeId) {
        PermissionShapePolicy.validate(type, action);
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
