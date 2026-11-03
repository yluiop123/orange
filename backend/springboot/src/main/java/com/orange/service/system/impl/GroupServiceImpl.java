package com.orange.service.system.impl;

import com.orange.domain.common.BusinessException;
import com.orange.domain.system.group.req.*;
import com.orange.domain.system.tree.TreeCodePolicy;
import com.orange.domain.system.tree.TreeIndex;
import com.orange.entity.Group;
import com.orange.repository.system.GroupRepository;
import com.orange.repository.system.UserRepository;
import com.orange.service.system.GroupService;
import com.orange.util.QueryUtils;
import jakarta.persistence.criteria.Predicate;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
public class GroupServiceImpl implements GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Group> queryGroups(QueryGroupReq req) {
        Specification<Group> spec = (root, query, cb) -> {
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
        // 同级顺序由编码决定，删除无需重排
        boolean textFilter = StringUtils.isNotBlank(req.getId()) || StringUtils.isNotBlank(req.getName());
        List<Group> matched = groupRepository.findAll(spec, Sort.by("id"));
        return textFilter ? includeAncestors(matched, groupRepository.findAll()) : matched;
    }

    @CacheEvict(value = "group", allEntries = true)
    @Override
    @Transactional
    public void deleteGroups(List<String> ids) {
        List<Group> all = groupRepository.findAll();
        TreeIndex<Group> index = TreeIndex.of(all, Group::getId, Group::getParentId);
        Set<String> requestedIds = new LinkedHashSet<>(ids);
        List<Group> selected = requestedIds.stream()
                .map(index::get)
                .filter(Objects::nonNull)
                .toList();
        if (selected.size() != requestedIds.size()) {
            throw new BusinessException("组织不存在");
        }

        Set<String> subtreeIds = index.subtreeIds(requestedIds);
        if (userRepository.existsByGroupIdIn(new ArrayList<>(subtreeIds))) {
            throw new BusinessException("组织或其子组织下有用户，不能删除");
        }

        // 先删深层节点，避免父子同时选中时父节点先删导致子节点找不到
        for (Group group : index.deleteOrder(subtreeIds)) {
            if (groupRepository.existsById(group.getId())) {
                groupRepository.delete(group);
                groupRepository.flush();
            }
        }
    }

    @CacheEvict(value = "group", allEntries = true)
    @Override
    @Transactional
    public Group addChild(AddChildGroupReq req) {
        String id = req.getId();
        String parentId = StringUtils.trimToNull(req.getParentId());
        TreeCodePolicy.GROUP.validate(id, parentId);
        if (groupRepository.existsById(id)) {
            throw new BusinessException("组织编码已存在");
        }
        if (parentId != null && !groupRepository.existsById(parentId)) {
            throw new BusinessException("父组织不存在");
        }
        Group group = new Group();
        group.setId(id);
        group.setName(req.getName());
        group.setParentId(parentId);
        return groupRepository.save(group);
    }

    @CacheEvict(value = "group", allEntries = true)
    @Override
    @Transactional
    public Group editGroup(EditGroupReq req) {
        if (req.getId() == null) {
            throw new BusinessException("组织ID不能为空");
        }
        Optional<Group> groupOptional = groupRepository.findById(req.getId());
        if(groupOptional.isEmpty()){
            throw new BusinessException("组织不存在");
        }
        Group group = groupOptional.get();
        if(req.getName()!=null){
            group.setName(req.getName());
        }
        if(req.getStatus()!=null){
            boolean disabling = !STATUS_DISABLE.equals(group.getStatus())
                    && STATUS_DISABLE.equals(req.getStatus());
            if (disabling) {
                assertNoEnabledDescendants(group.getId());
            }
            group.setStatus(req.getStatus());
        }
        return group;
    }

    @Cacheable(value = "group", key = "#id", condition = "#id != null and #id != ''")
    @Override
    @Transactional(readOnly = true)
    public Group queryGroup(String id) {
        if (id == null || id.isBlank()) {
            return new Group();
        }
        return groupRepository.findById(id)
                .orElseThrow(() -> new BusinessException("组织不存在"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Group> queryGroups(){
        Specification<Group> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), STATUS_ENABLE));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return groupRepository.findAll(spec, Sort.by("id"));
    }

    /**
     * 禁用父节点前要求先禁用子节点，避免“父节点隐藏、子节点仍然生效”的中间状态。
     */
    private void assertNoEnabledDescendants(String id) {
        TreeIndex<Group> index = TreeIndex.of(
                groupRepository.findAll(), Group::getId, Group::getParentId);
        if (index.hasEnabledDescendant(id, group -> STATUS_ENABLE.equals(group.getStatus()))) {
            throw new BusinessException("请先禁用子组织");
        }
    }

    /** 文本筛选时把祖先一并返回，前端才能保持树的层级。 */
    private List<Group> includeAncestors(List<Group> matched, List<Group> all) {
        TreeIndex<Group> index = TreeIndex.of(all, Group::getId, Group::getParentId);
        Set<String> ids = index.withAncestorIds(matched);
        return all.stream()
                .filter(group -> ids.contains(group.getId()))
                .sorted(Comparator.comparing(Group::getId))
                .toList();
    }

}
