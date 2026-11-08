package com.orange.repository.system;

import com.orange.entity.PermissionI18n;
import com.orange.entity.PermissionI18nId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface PermissionI18nRepository extends JpaRepository<PermissionI18n, PermissionI18nId> {

    List<PermissionI18n> findByPermissionIdOrderByLocaleAsc(String permissionId);

    List<PermissionI18n> findByPermissionIdInOrderByPermissionIdAscLocaleAsc(
            Collection<String> permissionIds);

    @Modifying(flushAutomatically = true)
    @Query("delete from PermissionI18n i where i.permissionId = :permissionId")
    void deleteByPermissionId(@Param("permissionId") String permissionId);

    @Modifying(flushAutomatically = true)
    @Query("delete from PermissionI18n i where i.permissionId in :permissionIds")
    void deleteByPermissionIdIn(@Param("permissionIds") Collection<String> permissionIds);
}
