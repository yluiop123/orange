package com.orange.service.system.impl;

import com.orange.domain.common.BusinessException;
import com.orange.domain.system.permission.req.*;
import com.orange.entity.Permission;
import com.orange.repository.system.PermissionRepository;
import com.orange.repository.system.UserRepository;
import com.orange.service.system.PermissionService;
import jakarta.persistence.criteria.Predicate;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.List;
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

    @Override
    public List<Permission> queryPermissions(QueryPermissionReq req) {
        Specification<Permission> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            String id = req.getId();
            String name = req.getName();
            String path = req.getPath();
            String status = req.getStatus();
            if (id!=null&&!id.isEmpty()) {
                predicates.add( cb.like(cb.lower(root.get("id")), id.toLowerCase() + "%"));
            }
            if (name!=null&&!name.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), name.toLowerCase() + "%"));
            }
            if (path!=null&&!path.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("path")), path.toLowerCase() + "%"));
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
        List<Permission> list = permissionRepository.findAllById(ids);

        if (list.isEmpty()) {
            throw  new BusinessException("权限不存在");
        }
        for (Permission permission : list) {
            if(!CollectionUtils.isEmpty(permission.getRoles())){
                throw  new BusinessException("权限"+permission.getId()+"已被角色引用，不能删除");
            }
            if (!CollectionUtils.isEmpty(permission.getUsers())) {
                throw  new BusinessException("权限"+permission.getId()+"已被用户引用，不能删除");
            }
        }
        // 1 收集受影响的 parentId
        Set<String> parentIds = list.stream()
                .map(Permission::getParentId)
                .collect(Collectors.toSet());
        // 2 删除节点：先删深层节点，避免父子同时选中时父节点级联删除导致重复删除
        list.sort((a, b) -> Integer.compare(b.getId().length(), a.getId().length()));
        for (Permission node : list) {
            if (permissionRepository.existsById(node.getId())) {
                permissionRepository.delete(node);
                permissionRepository.flush();
            }
        }
        // 3 重新排序
        for (String parentId : parentIds) {
            List<Permission> children;
            if (parentId == null) {
                children = permissionRepository.findByParentIdIsNullOrderByOrder();
            } else {
                children = permissionRepository.findByParentIdOrderByOrder(parentId);
            }
            int index = 0;
            for (Permission g : children) {
                g.setOrder(index++);
            }
        }
    }
    @Override
    @Transactional
    public void movePermission(MovePermissionReq req) {
        Optional<Permission> permissionOptional = permissionRepository.findById(req.getId());
        Permission permission = permissionOptional.orElse(null);
        if (permission==null) {
            return;
        }
        if ("top".equals(req.getAction())) {
            List<Permission> list = permission.getParentId() == null
                    ? permissionRepository.queryByParentIdIsNullAndOrderNotOrderByOrder(permission.getOrder())
                    : permissionRepository.queryByParentIdAndOrderNotOrderByOrder(permission.getParentId(), permission.getOrder());
            for(int i=0;i<list.size();i++){
                Permission permissionI = list.get(i);
                permissionI.setOrder(i+1);
            }
            permission.setOrder(0);
        } else if ("up".equals(req.getAction())) {
            Permission swapPermission = permission.getParentId() == null
                    ? permissionRepository.queryByParentIdIsNullAndOrder(permission.getOrder()-1)
                    : permissionRepository.queryByParentIdAndOrder(permission.getParentId(), permission.getOrder()-1);
            swapPermission.setOrder(permission.getOrder());
            permission.setOrder(permission.getOrder() - 1);
        } else if ("down".equals(req.getAction())) {
            Permission swapPermission = permission.getParentId() == null
                    ? permissionRepository.queryByParentIdIsNullAndOrder(permission.getOrder()+1)
                    : permissionRepository.queryByParentIdAndOrder(permission.getParentId(), permission.getOrder()+1);
            swapPermission.setOrder(permission.getOrder());
            permission.setOrder(permission.getOrder() + 1);
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
        Permission brotherPermission = brotherGroupOptional.orElse(null);
        if(brotherPermission==null){
            return null;
        }
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
        Optional<Permission> optionalPermission = permissionRepository.findById(req.getId());
        if(optionalPermission.isEmpty()){
            return null;
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
    public Permission queryPermission(String id) {
        return permissionRepository.findById(id).orElse(null);
    }
    @Override
    public List<Permission> queryPermissions() {
        Specification<Permission> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), STATUS_ENABLE));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return permissionRepository.findAll(spec);
    }

    private void assertUniquePermission(String type, String path, String action, String excludeId) {
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
