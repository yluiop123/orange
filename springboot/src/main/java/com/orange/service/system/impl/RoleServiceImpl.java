package com.orange.service.system.impl;

import com.orange.domain.common.BusinessException;
import com.orange.domain.common.PageData;
import com.orange.domain.system.role.req.AddRoleReq;
import com.orange.domain.system.role.req.EditRoleReq;
import com.orange.domain.system.role.req.QueryRoleReq;
import com.orange.domain.system.role.resp.RoleBean;
import com.orange.entity.Permission;
import com.orange.entity.Role;
import com.orange.repository.system.PermissionRepository;
import com.orange.repository.system.RoleRepository;
import com.orange.security.auth.GrantGuard;
import com.orange.service.system.RoleService;
import com.orange.util.QueryUtils;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.orange.config.Constanst.STATUS_ALL;

@Service
public class RoleServiceImpl implements RoleService {
    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private GrantGuard grantGuard;

    private static final Set<String> ROLE_SORT_FIELDS =
            Set.of("id", "name", "status", "createTime", "updateTime");

    @Override
    @Transactional(readOnly = true)
    public PageData<Role> queryRoles(QueryRoleReq req) {
        String requestedSort = req.getSort() != null ? req.getSort() : req.getOrderField();
        String sortBy = requestedSort != null && ROLE_SORT_FIELDS.contains(requestedSort)
                ? requestedSort : "id";
        String requestedDirection = req.getDirection() != null ? req.getDirection() : req.getOrderValue();
        String sortDir = requestedDirection == null || requestedDirection.isBlank()
                ? "asc" : requestedDirection;
        if (!sortDir.equalsIgnoreCase("asc") && !sortDir.equalsIgnoreCase("desc")) {
            throw new BusinessException("排序方向只能是 asc 或 desc");
        }
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())?
                Sort.by(sortBy).ascending(): Sort.by(sortBy).descending();

        Specification<Role> spec = (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();
            String id = req.getId();
            String name = req.getName();
            String status = req.getStatus();
            if (id!=null&&!id.isEmpty()) {
                predicates.add( cb.like(cb.lower(root.get("id")), QueryUtils.likePrefix(id), '\\'));
            }
            if (name!=null&&!name.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), QueryUtils.likePrefix(name), '\\'));
            }
            if (status!=null&&!status.isEmpty()&&!STATUS_ALL.equals(status)) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Pageable pageable = PageRequest.of(req.getPage()-1, req.getSize(), sort);
        Page<Role> pageRole = roleRepository.findAll(spec, pageable);
        return new PageData<>(pageRole.getTotalElements(), pageRole.getContent(),
                req.getPage(), req.getSize(), pageRole.getTotalPages());
    }

    @Override
    @Transactional
    public Role addRole(AddRoleReq req) {
        String roleId = req.getId();
        if (roleId == null || roleId.isBlank()) {
            roleId = UUID.randomUUID().toString();
        } else if (roleRepository.existsById(roleId)) {
            throw new BusinessException("角色ID已存在");
        }
        Role role = new Role();
        role.setId(roleId);
        role.setName(req.getName());
        grantGuard.assertCanAssignPermissions(req.getPermissions());
        List<Permission> permissions = req.getPermissions() == null
                ? List.of()
                : permissionRepository.findAllById(req.getPermissions());
        role.getPermissions().clear(); // 先清掉原来的权限
        role.getPermissions().addAll(permissions);
        return roleRepository.save(role);
    }

    @Override
    @Transactional
    public Role editRole(EditRoleReq req) {
        if (req.getId() == null) {
            throw new BusinessException("角色ID不能为空");
        }
        Optional<Role> roleOptional = roleRepository.findById(req.getId());
        if (roleOptional.isEmpty()) {
            throw new BusinessException("角色不存在");
        }

        Role role = roleOptional.get();
        role.setId(req.getId());

        if (req.getName() != null) {
            role.setName(req.getName());
        }

        if (req.getStatus() != null) {
            role.setStatus(req.getStatus());
        }

        if (req.getPermissions() != null) {
            grantGuard.assertCanAssignPermissions(req.getPermissions());
            role.getPermissions().clear();
            if(!req.getPermissions().isEmpty()){
                List<Permission> permissions =
                        permissionRepository.findAllById(req.getPermissions());
                role.getPermissions().addAll(permissions);
            }
        }
        return role;
    }

    @Override
    @Transactional
    public void deleteRoles(List<String> ids) {
        List<Role> list = roleRepository.findAllById(ids);
        if (list.isEmpty()) {
            throw new BusinessException("角色不存在");
        }
        for (Role role : list) {
            if (!role.getUsers().isEmpty()) {
                throw new BusinessException("角色" + role.getId() + "已被用户引用，不能删除");
            }
        }
        // 角色自身拥有的权限不是外部引用，删除角色时一并清理关联
        for (Role role : list) {
            role.getPermissions().clear();
        }
        roleRepository.deleteAll(list);
    }

    @Override
    @Transactional(readOnly = true)
    public RoleBean queryRole(String id) {
        Role role = roleRepository.findWithAllAttributesById(id);
        if (role == null) {
            throw new BusinessException("角色不存在");
        }
        RoleBean roleBean = new RoleBean();
        roleBean.setId(role.getId());
        roleBean.setName(role.getName());
        roleBean.setStatus(role.getStatus());
        roleBean.setPermissions(role.getPermissions().stream().map(Permission::getId).collect(Collectors.toList()));
        return roleBean;
    }
}
