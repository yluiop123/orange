package com.orange.service.system.impl;

import com.orange.domain.login.resp.MenuInfo;
import com.orange.entity.Permission;
import com.orange.repository.system.PermissionRepository;
import com.orange.service.system.MenuService;
import jakarta.persistence.criteria.Predicate;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.orange.config.Constanst.STATUS_ENABLE;

@Slf4j
@Service
public class MenuServiceImpl implements MenuService {

    private static final List<String> MENU_TYPES = List.of("menu", "directory");

    @Autowired
    private PermissionRepository permissionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MenuInfo> queryMenuTree() {
        Specification<Permission> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), STATUS_ENABLE));
            predicates.add(root.get("type").in(MENU_TYPES));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        List<Permission> permissions = permissionRepository.findAll(
                spec, Sort.by(Sort.Direction.ASC, "id"));

        Map<String, MenuInfo> nodes = new LinkedHashMap<>();
        for (Permission permission : permissions) {
            MenuInfo node = new MenuInfo();
            node.setId(permission.getId());
            node.setPath(permission.getPath());
            node.setType(permission.getType());
            node.setName(permission.getName());
            nodes.put(permission.getId(), node);
        }

        List<MenuInfo> roots = new ArrayList<>();
        for (Permission permission : permissions) {
            MenuInfo node = nodes.get(permission.getId());
            String parentId = permission.getParentId();
            MenuInfo parent = StringUtils.isBlank(parentId) ? null : nodes.get(parentId);
            if (parent != null) {
                parent.getChildren().add(node);
            } else if (StringUtils.isBlank(parentId)) {
                roots.add(node);
            } else {
                // 父节点被禁用或不存在时，整个分支不可见，而不是提升为根节点
                log.warn("菜单 {} 的父节点 {} 已禁用或不存在，已跳过",
                        permission.getId(), parentId);
            }
        }
        return roots;
    }
}
