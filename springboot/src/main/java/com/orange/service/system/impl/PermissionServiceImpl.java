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
        return permissionRepository.findAll(spec);
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

        // 只重排“被删除节点所在层”的兄弟节点
        Set<String> parentIds = selected.stream()
                .map(Permission::getParentId)
                .collect(Collectors.toSet());

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

        for (String parentId : parentIds) {
            List<Permission> children = parentId == null
                    ? permissionRepository.findByParentIdIsNullOrderByOrder()
                    : permissionRepository.findByParentIdOrderByOrder(parentId);
            int index = 0;
            for (Permission child : children) {
                child.setOrder(index++);
            }
        }
    }
    @Override
    @Transactional
    public void movePermission(MovePermissionReq req) {
        Optional<Permission> permissionOptional = permissionRepository.findById(req.getId());
        Permission permission = permissionOptional.orElseThrow(
                () -> new BusinessException("权限不存在"));
        Integer order = permission.getOrder();
        if (order == null) {
            throw new BusinessException("权限排序数据异常");
        }
        if ("top".equals(req.getAction())) {
            List<Permission> list = permission.getParentId() == null
                    ? permissionRepository.queryByParentIdIsNullAndOrderNotOrderByOrder(order)
                    : permissionRepository.queryByParentIdAndOrderNotOrderByOrder(permission.getParentId(), order);
            for(int i=0;i<list.size();i++){
                Permission permissionI = list.get(i);
                permissionI.setOrder(i+1);
            }
            permission.setOrder(0);
        } else if ("up".equals(req.getAction())) {
            if (order <= 0) {
                return;
            }
            Permission swapPermission = permission.getParentId() == null
                    ? permissionRepository.queryByParentIdIsNullAndOrder(order-1)
                    : permissionRepository.queryByParentIdAndOrder(permission.getParentId(), order-1);
            if (swapPermission == null) {
                return;
            }
            swapPermission.setOrder(order);
            permission.setOrder(order - 1);
        } else if ("down".equals(req.getAction())) {
            Permission swapPermission = permission.getParentId() == null
                    ? permissionRepository.queryByParentIdIsNullAndOrder(order+1)
                    : permissionRepository.queryByParentIdAndOrder(permission.getParentId(), order+1);
            if (swapPermission == null) {
                return;
            }
            swapPermission.setOrder(order);
            permission.setOrder(order + 1);
        }

    }

    @Override
    @Transactional
    public Permission addChild(AddChildPermissionReq req) {
        boolean exists = permissionRepository.existsById(req.getId());
        if(exists){
            throw  new BusinessException( "权限编码已存在");
        }
        assertUniquePermission(req.getType(), req.getPath(), req.getAction(), null);
        if(StringUtils.isEmpty(req.getParentId())){
            if(req.getId().length()!=4){
                throw  new BusinessException( "权限编码长度必须为4");
            }
        }else{
            String parentId = StringUtils.left(req.getId(), req.getId().length() - 2);
            if(req.getParentId().length()+2!=req.getId().length()){
                throw  new BusinessException( "权限编码长度必须为"+(req.getParentId().length()+2));
            }
            if(!StringUtils.equals(parentId, req.getParentId())){
                throw  new BusinessException("权限编码必须以"+req.getParentId()+"开头");
            }
        }
        String parentId = StringUtils.isEmpty(req.getParentId()) ? null : req.getParentId();
        if (parentId != null && !permissionRepository.existsById(parentId)) {
            throw new BusinessException("父权限不存在");
        }
        Optional<Permission> lastPermissionOptional = parentId == null
                ? permissionRepository.findFirstByParentIdIsNullOrderByOrderDesc()
                : permissionRepository.findFirstByParentIdOrderByOrderDesc(parentId);
        Permission lastPermission = lastPermissionOptional.orElse(null);
        Permission permission = new Permission();
        permission.setId(req.getId());
        permission.setName(req.getName());
        permission.setPath(req.getPath());
        permission.setType(req.getType());
        permission.setAction(req.getAction());
        permission.setParentId(parentId);
        if (lastPermission != null) {
            permission.setOrder(lastPermission.getOrder() + 1);
        } else {
            permission.setOrder(0);
        }
        return permissionRepository.save(permission);
    }

    @Override
    @Transactional
    public Permission addBrother(AddBrotherPermissionReq req) {
        boolean exists = permissionRepository.existsById(req.getId());
        if(exists){
            throw  new BusinessException("权限编码已存在");
        }
        assertUniquePermission(req.getType(), req.getPath(), req.getAction(), null);

        Optional<Permission> brotherGroupOptional = permissionRepository.findById(req.getBrotherId());
        Permission brotherPermission = brotherGroupOptional.orElseThrow(
                () -> new BusinessException("同级权限不存在"));
        Integer order = brotherPermission.getOrder();
        String parentId = brotherPermission.getParentId();

        String id = req.getId();
        String idParentId = StringUtils.left(id, id.length() - 2);
        String parentIdDefault = StringUtils.defaultString(parentId);
        if(id.length()!=parentIdDefault.length()+2){
            throw  new BusinessException("权限编码长度必须为"+(parentIdDefault.length()+2));
        }
        if(!parentIdDefault.equals(idParentId)){
            throw  new BusinessException("权限编码必须以"+parentId+"开头");
        }
        Specification<Permission> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (parentId!=null&&!parentId.isEmpty()) {
                predicates.add(cb.equal(root.get("parentId"), parentId));
            } else {
                predicates.add(cb.isNull(root.get("parentId")));
            }
            if (order!=null) {
                predicates.add(cb.greaterThan(root.get("order"), order));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        List<Permission> groups = permissionRepository.findAll(spec);
        groups.forEach(group -> group.setOrder(group.getOrder() + 1));

        Permission permission = new Permission();
        permission.setId(req.getId());
        permission.setName(req.getName());
        permission.setPath(req.getPath());
        permission.setAction(req.getAction());
        permission.setType(req.getType());
        permission.setOrder((order==null?0:order)+1);
        permission.setParentId(brotherPermission.getParentId());
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
        return permissionRepository.findAll(spec);
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
