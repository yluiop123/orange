package com.orange.repository.system;

import com.orange.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission,String>, JpaSpecificationExecutor<Permission> {
    Optional<Permission> findFirstByParentIdOrderByOrderDesc(String parentId);
    Optional<Permission> findFirstByParentIdIsNullOrderByOrderDesc();

    Permission queryByParentIdAndOrder(String parentId, Integer order);
    Permission queryByParentIdIsNullAndOrder(Integer order);

    List<Permission> queryByParentIdAndOrderNotOrderByOrder(String parentId, Integer order);
    List<Permission> queryByParentIdIsNullAndOrderNotOrderByOrder(Integer order);

    List<Permission> findAllByIdLike(String id);

    List<Permission> findByParentIdIsNullOrderByOrder();
    List<Permission> findByParentIdOrderByOrder(String parentId);

}
