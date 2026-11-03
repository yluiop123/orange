package com.orange.repository.system;

import com.orange.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User,String>, JpaSpecificationExecutor<User> {

    User findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByPermissions_IdIn(Collection<String> permissionIds);

    long countByRoles_IdAndStatus(String roleId, String status);

    @EntityGraph(attributePaths = {"roles", "roles.permissions", "permissions"})
    User findWithAllAttributesById(String id);

    /** 只抓取角色和角色权限，避免与直属权限同时 join 产生笛卡尔积。 */
    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    User findWithRolesByUsername(String username);

    /** 只抓取用户直属权限，与角色查询分开执行。 */
    @EntityGraph(attributePaths = {"permissions"})
    User findWithPermissionsByUsername(String username);

    boolean existsByGroupIdIn(List<String> groupIds);

}
