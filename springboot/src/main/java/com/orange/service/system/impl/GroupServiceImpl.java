package com.orange.service.system.impl;

import com.orange.domain.common.BusinessException;
import com.orange.domain.system.group.req.*;
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
public class GroupServiceImpl implements GroupService {

    /** 根组织编码长度 */
    private static final int ROOT_CODE_LENGTH = 2;
    /** 每层子编码比父编码多出的位数 */
    private static final int CODE_SEGMENT_LENGTH = 2;

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
        return groupRepository.findAll(spec, Sort.by("id"));
    }

    @CacheEvict(value = "group", allEntries = true)
    @Override
    @Transactional
    public void deleteGroups(List<String> ids) {
        List<Group> all = groupRepository.findAll();
        Map<String, Group> byId = all.stream()
                .collect(Collectors.toMap(Group::getId, group -> group));
        Set<String> requestedIds = new LinkedHashSet<>(ids);
        List<Group> selected = requestedIds.stream()
                .map(byId::get)
                .filter(Objects::nonNull)
                .toList();
        if (selected.size() != requestedIds.size()) {
            throw new BusinessException("组织不存在");
        }

        Map<String, List<Group>> childrenByParent = all.stream()
                .filter(group -> group.getParentId() != null)
                .collect(Collectors.groupingBy(Group::getParentId));
        Set<String> subtreeIds = new LinkedHashSet<>();
        Deque<String> queue = new ArrayDeque<>(requestedIds);
        while (!queue.isEmpty()) {
            String id = queue.poll();
            if (subtreeIds.add(id)) {
                childrenByParent.getOrDefault(id, List.of())
                        .forEach(child -> queue.add(child.getId()));
            }
        }

        if (userRepository.existsByGroupIdIn(new ArrayList<>(subtreeIds))) {
            throw new BusinessException("组织或其子组织下有用户，不能删除");
        }

        // 先删深层节点，避免父子同时选中时父节点先删导致子节点找不到
        List<Group> toDelete = all.stream()
                .filter(group -> subtreeIds.contains(group.getId()))
                .sorted(Comparator.comparingInt((Group group) -> group.getId().length()).reversed())
                .toList();
        for (Group group : toDelete) {
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
        validateCode(id, parentId);
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
     * 组织编码即层级顺序：根编码 2 位，子编码 = 父编码 + 2 位数字。
     * 编码一旦创建不可修改，所以这里只做校验，不生成。
     */
    private void validateCode(String id, String parentId) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException("组织编码不能为空");
        }
        if (!id.matches("^[0-9]+$")) {
            throw new BusinessException("组织编码只能包含数字");
        }
        if (parentId == null) {
            if (id.length() != ROOT_CODE_LENGTH) {
                throw new BusinessException("根组织编码长度必须为" + ROOT_CODE_LENGTH);
            }
            return;
        }
        int expectedLength = parentId.length() + CODE_SEGMENT_LENGTH;
        if (id.length() != expectedLength) {
            throw new BusinessException("组织编码长度必须为" + expectedLength);
        }
        if (!id.startsWith(parentId)) {
            throw new BusinessException("组织编码必须以" + parentId + "开头");
        }
    }
}
