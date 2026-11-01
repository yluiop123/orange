package com.orange.repository.system;

import com.orange.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group,String>, JpaSpecificationExecutor<Group> {
    Optional<Group> findFirstByParentIdOrderByOrderDesc(String parentId);
    Optional<Group> findFirstByParentIdIsNullOrderByOrderDesc();

    Group queryByParentIdAndOrder(String parentId,Integer order);
    Group queryByParentIdIsNullAndOrder(Integer order);

    List<Group> queryByParentIdAndOrderNotOrderByOrder(String parentId, Integer order);
    List<Group> queryByParentIdIsNullAndOrderNotOrderByOrder(Integer order);

    List<Group> findByParentIdIsNullOrderByOrder();
    List<Group> findByParentIdOrderByOrder(String parentId);
}
