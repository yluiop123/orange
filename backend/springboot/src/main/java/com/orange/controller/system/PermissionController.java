package com.orange.controller.system;

import com.orange.domain.common.Response;
import com.orange.domain.system.permission.req.*;
import com.orange.domain.system.permission.resp.PermissionBean;
import com.orange.entity.Permission;
import com.orange.service.system.PermissionService;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Tag(name = "权限管理", description = "权限管理相关接口")
@RestController
@RequestMapping("/api/v1/system/permissions")
public class PermissionController {
    @Autowired
    private PermissionService permissionService;

    @Operation(summary = "查询权限列表", description = "支持按 ID、名称、状态过滤")
    @GetMapping
    @PreAuthorize("hasAuthority('menu#/system/permission')")
    public Response<List<PermissionBean>> queryPermissions(@Valid @ModelAttribute QueryPermissionReq req) {
        return Response.ok(toBeans(permissionService.queryPermissions(req)));
    }

    @Operation(summary = "查询权限详情", description = "根据权限ID查询权限详情")
    @GetMapping("/{permissionId}")
    @PreAuthorize("hasAuthority('menu#/system/permission')")
    public Response<PermissionBean> queryPermission(
            @Schema(description = "权限ID", example = "1")
            @PathVariable("permissionId") String permissionId) {
        Permission permission = permissionService.queryPermission(permissionId);
        return Response.ok(PermissionBean.from(
                permission, permissionService.queryTranslations(permission.getId())));
    }

    @Operation(summary = "编辑权限", description = "根据权限ID更新权限信息")
    @PatchMapping("/{permissionId}")
    @PreAuthorize("hasAuthority('action#/system/permission:edit')")
    public Response<String> editPermission(@PathVariable("permissionId") String permissionId,
                                           @Valid @RequestBody EditPermissionReq req) {
        req.setId(permissionId);
        permissionService.editPermission(req);
        return Response.ok("操作成功");
    }

    @Operation(summary = "删除权限", description = "根据权限ID列表删除权限，多个 ID 用逗号分隔")
    @DeleteMapping
    @PreAuthorize("hasAuthority('action#/system/permission:delete')")
    public Response<String> deletePermissions(@RequestParam("ids") String ids) {
        permissionService.deletePermissions(splitIds(ids));
        return Response.ok("操作成功");
    }

    @Operation(summary = "删除权限", description = "根据权限ID删除权限")
    @DeleteMapping("/{permissionId}")
    @PreAuthorize("hasAuthority('action#/system/permission:delete')")
    public Response<String> deletePermission(@PathVariable("permissionId") String permissionId) {
        permissionService.deletePermissions(List.of(permissionId));
        return Response.ok("操作成功");
    }

    @Operation(summary = "添加子权限", description = "在指定父权限下添加子权限")
    @PostMapping("/children")
    @PreAuthorize("hasAuthority('action#/system/permission:add')")
    public Response<PermissionBean> addChild(@Valid @RequestBody AddChildPermissionReq req) {
        Permission permission = permissionService.addChild(req);
        return Response.ok(PermissionBean.from(
                permission, permissionService.queryTranslations(permission.getId())));
    }

    // ===== 兼容旧接口（已废弃，后续版本移除） =====
    @Deprecated
    @Hidden
    @Operation(summary = "查询权限列表（旧）", deprecated = true)
    @PostMapping
    @PreAuthorize("hasAuthority('menu#/system/permission')")
    public Response<List<PermissionBean>> queryPermissionsLegacy(@Valid @RequestBody QueryPermissionReq req) {
        return Response.ok(toBeans(permissionService.queryPermissions(req)));
    }

    @Deprecated
    @Hidden
    @Operation(summary = "查询权限详情（旧）", deprecated = true)
    @GetMapping("/detail/{permissionId}")
    @PreAuthorize("hasAuthority('menu#/system/permission')")
    public Response<PermissionBean> queryPermissionLegacy(@PathVariable("permissionId") String permissionId) {
        Permission permission = permissionService.queryPermission(permissionId);
        return Response.ok(PermissionBean.from(
                permission, permissionService.queryTranslations(permission.getId())));
    }

    @Deprecated
    @Hidden
    @Operation(summary = "添加子权限（旧）", deprecated = true)
    @PostMapping("/addChild")
    @PreAuthorize("hasAuthority('action#/system/permission:add')")
    public Response<PermissionBean> addChildLegacy(@Valid @RequestBody AddChildPermissionReq req) {
        Permission permission = permissionService.addChild(req);
        return Response.ok(PermissionBean.from(
                permission, permissionService.queryTranslations(permission.getId())));
    }

    @Deprecated
    @Hidden
    @Operation(summary = "编辑权限（旧）", deprecated = true)
    @PostMapping("/edit")
    @PreAuthorize("hasAuthority('action#/system/permission:edit')")
    public Response<String> editPermissionLegacy(@Valid @RequestBody EditPermissionReq req) {
        permissionService.editPermission(req);
        return Response.ok("操作成功");
    }

    private List<PermissionBean> toBeans(List<Permission> permissions) {
        Map<String, Map<String, String>> translations = permissionService.queryTranslations(
                permissions.stream().map(Permission::getId).toList());
        return permissions.stream()
                .map(permission -> PermissionBean.from(
                        permission,
                        translations.getOrDefault(permission.getId(), Map.of())))
                .toList();
    }

    private static List<String> splitIds(String ids) {
        return Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .toList();
    }
}
