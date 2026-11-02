package com.orange.repository.system;

import com.orange.entity.Role;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;

@Repository
public interface RoleRepository extends JpaRepository<Role,String> , JpaSpecificationExecutor<Role> {
    boolean existsByPermissions_IdIn(Collection<String> permissionIds);

    @EntityGraph(attributePaths = {"permissions"})
    Role findWithAllAttributesById(String id);
}
