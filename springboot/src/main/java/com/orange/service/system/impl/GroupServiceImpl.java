package com.orange.service.system.impl;

import com.orange.domain.common.BusinessException;
import com.orange.domain.system.group.req.*;
import com.orange.entity.Group;
import com.orange.repository.system.GroupRepository;
import com.orange.repository.system.UserRepository;
import com.orange.service.system.GroupService;
import jakarta.persistence.criteria.Predicate;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.orange.config.Constanst.STATUS_ALL;
import static com.orange.config.Constanst.STATUS_ENABLE;

@Service
public class GroupServiceImpl implements GroupService {
    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public List<Group> queryGroups(QueryGroupReq req) {
        Specification<Group> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            String id = req.getId();
            String name = req.getName();
            String status = req.getStatus();
            if (id!=null&&!id.isEmpty()) {
                predicates.add( cb.like(cb.lower(root.get("id")), id.toLowerCase() + "%"));
            }
            if (name!=null&&!name.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), name.toLowerCase() + "%"));
            }
            if (status!=null&&!status.isEmpty()&&!STATUS_ALL.equals(status)) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return groupRepository.findAll(spec);
    }

    @CacheEvict(value = "group", allEntries = true)
    @Override
    @Transactional
    public void deleteGroups(List<String> ids) {
        List<Group> list = groupRepository.findAllById(ids);
        if (list.isEmpty()) {
            throw new BusinessException("组织不存在");
        }
        List<String> groupIds = list.stream().map(Group::getId).toList();
        if(userRepository.existsByGroupIdIn(groupIds)){
            throw new BusinessException("组织下有用户，不能删除");
        }
        // 1 收集受影响的 parentId
        Set<String> parentIds = list.stream()
                .map(Group::getParentId)
                .collect(Collectors.toSet());
        // 2 删除节点：先删深层节点，避免父子同时选中时父节点级联删除导致重复删除
        list.sort((a, b) -> Integer.compare(b.getId().length(), a.getId().length()));
        for (Group node : list) {
            if (groupRepository.existsById(node.getId())) {
                groupRepository.delete(node);
                groupRepository.flush();
            }
        }
        // 3 重新排序
        for (String parentId : parentIds) {
            List<Group> children;
            if (parentId == null) {
                children = groupRepository.findByParentIdIsNullOrderByOrder();
            } else {
                children = groupRepository.findByParentIdOrderByOrder(parentId);
            }
            int index = 0;
            for (Group g : children) {
                g.setOrder(index++);
            }
        }

    }

    @CacheEvict(value = "group", allEntries = true)
    @Override
    @Transactional
    public void moveGroup(MoveGroupReq req) {
        Optional<Group> groupOptional = groupRepository.findById(req.getId());
        Group group = groupOptional.orElse(null);
        if (group==null) {
            return;
        }
        if ("top".equals(req.getAction())) {
            List<Group> list = group.getParentId() == null
                    ? groupRepository.queryByParentIdIsNullAndOrderNotOrderByOrder(group.getOrder())
                    : groupRepository.queryByParentIdAndOrderNotOrderByOrder(group.getParentId(), group.getOrder());
            for(int i=0;i<list.size();i++){
                Group groupI = list.get(i);
                groupI.setOrder(i+1);
            }
            group.setOrder(0);
        } else if ("up".equals(req.getAction())) {
            Group swapGroup = group.getParentId() == null
                    ? groupRepository.queryByParentIdIsNullAndOrder(group.getOrder()-1)
                    : groupRepository.queryByParentIdAndOrder(group.getParentId(), group.getOrder()-1);
            swapGroup.setOrder(group.getOrder());
            group.setOrder(group.getOrder() - 1);
        } else if ("down".equals(req.getAction())) {
            Group swapGroup = group.getParentId() == null
                    ? groupRepository.queryByParentIdIsNullAndOrder(group.getOrder()+1)
                    : groupRepository.queryByParentIdAndOrder(group.getParentId(), group.getOrder()+1);
            swapGroup.setOrder(group.getOrder());
            group.setOrder(group.getOrder() + 1);
        }

    }

    @CacheEvict(value = "group", allEntries = true)
    @Override
    @Transactional
    public Group addChild(AddChildGroupReq user) {
        boolean exists = groupRepository.existsById(user.getId());
        if(exists){
            throw  new BusinessException("组织编码已存在");
        }
        if(StringUtils.isEmpty(user.getParentId())){
            if(user.getId().length()!=2){
                throw  new BusinessException( "组织编码长度必须为2");
            }
        }else{
            String parentId = StringUtils.left(user.getId(), user.getId().length() - 2);
            if(user.getParentId().length()+2!=user.getId().length()){
                throw  new BusinessException("组织编码长度必须为"+(user.getParentId().length()+2));
            }
            if(!StringUtils.equals(parentId, user.getParentId())){
                throw  new BusinessException("组织编码必须以"+user.getParentId()+"开头");
            }
        }
        String parentId = StringUtils.isEmpty(user.getParentId()) ? null : user.getParentId();
        Optional<Group> lastGroupOptional = parentId == null
                ? groupRepository.findFirstByParentIdIsNullOrderByOrderDesc()
                : groupRepository.findFirstByParentIdOrderByOrderDesc(parentId);
        Group lastGroup = lastGroupOptional.orElse(null);
        Group group = new Group();
        group.setId(user.getId());
        group.setName(user.getName());
        group.setParentId(parentId);
        if (lastGroup != null) {
            group.setOrder(lastGroup.getOrder() + 1);
        } else {
            group.setOrder(0);
        }
        return groupRepository.save(group);
    }

    @CacheEvict(value = "group", allEntries = true)
    @Override
    @Transactional
    public Group addBrother(AddBrotherGroupReq user) {
        boolean exists = groupRepository.existsById(user.getId());
        if(exists){
            throw  new BusinessException("组织编码已存在");
        }
        Optional<Group> brotherGroupOptional = groupRepository.findById(user.getBrotherId());
        Group brotherGroup = brotherGroupOptional.orElse(null);
        if(brotherGroup==null){
            return null;
        }
        String parentId = brotherGroup.getParentId();
        Integer order = brotherGroup.getOrder();

        String id = user.getId();
        String idParentId = StringUtils.left(id, id.length() - 2);
        String parentIdDefault = StringUtils.defaultString(parentId);
        if(id.length()!=parentIdDefault.length()+2){
            throw  new BusinessException("组织编码长度必须为"+(parentIdDefault.length()+2));
        }
        if(!parentIdDefault.equals(idParentId)){
            throw  new BusinessException("组织编码必须以"+parentId+"开头");
        }
        Specification<Group> spec = (root, query, cb) -> {
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
        List<Group> groups = groupRepository.findAll(spec);
        groups.forEach(group -> group.setOrder(group.getOrder() + 1));
        Group group = new Group();
        group.setId(user.getId());
        group.setName(user.getName());
        group.setParentId(brotherGroup.getParentId());
        group.setOrder((order==null?0:order)+1);
        return groupRepository.save(group);
    }

    @CacheEvict(value = "group", allEntries = true)
    @Override
    @Transactional
    public Group editGroup(EditGroupReq req) {
        Optional<Group> groupOptional = groupRepository.findById(req.getId());
        if(groupOptional.isEmpty()){
            return null;
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

    @Cacheable(value = "group", key = "#id")
    @Override
    public Group queryGroup(String id) {
        return groupRepository.findById(id).orElse(new Group());
    }

    @Override
    public List<Group> queryGroups(){
        Specification<Group> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), STATUS_ENABLE));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return groupRepository.findAll(spec);
    }
}
