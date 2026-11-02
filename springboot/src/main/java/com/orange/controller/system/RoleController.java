package com.orange.controller.system;

import com.orange.domain.common.PageData;
import com.orange.domain.common.Response;
import com.orange.domain.system.role.req.AddRoleReq;
import com.orange.domain.system.role.req.EditRoleReq;
import com.orange.domain.system.role.req.QueryRoleReq;
import com.orange.domain.system.role.resp.RoleBean;
import com.orange.entity.Role;
import com.orange.service.system.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@Tag(name = "角色管理", description = "角色管理相关接口")
@RestController
@RequestMapping("/api/v1/system/roles")
public class RoleController {
    @Autowired
    private RoleService roleService;

    @Operation(summary = "查询角色列表", description = "支持分页、过滤和排序")
    @GetMapping
    @PreAuthorize("hasAuthority('menu#/system/role')")
    public Response<PageData<Role>> queryRoles(@Valid @ModelAttribute QueryRoleReq req) {
        PageData<Role> pageData = roleService.queryRoles(req);
        return Response.ok(pageData);
    }

    @Operation(summary = "查询角色详情", description = "根据角色ID查询角色详情")
    @GetMapping("/{roleId}")
    @PreAuthorize("hasAuthority('menu#/system/role')")
    public Response<RoleBean> queryRole(@Parameter(description = "角色ID", example = "1")
                                        @PathVariable("roleId") String roleId) {
        return Response.ok(roleService.queryRole(roleId));
    }

    @Operation(summary = "新增角色", description = "根据角色信息新增角色")
    @PostMapping
    @PreAuthorize("hasAuthority('action#/system/role:add')")
    public Response<String> addRole(@Valid @RequestBody AddRoleReq req) {
        return Response.ok("操作成功", roleService.addRole(req).getId());
    }

    @Operation(summary = "编辑角色", description = "根据角色ID更新角色信息")
    @PatchMapping("/{roleId}")
    @PreAuthorize("hasAuthority('action#/system/role:edit')")
    public Response<String> editRole(@PathVariable("roleId") String roleId, @Valid @RequestBody EditRoleReq req) {
        req.setId(roleId);
        roleService.editRole(req);
        return Response.ok("操作成功");
    }

    @Operation(summary = "删除角色", description = "根据角色ID列表删除角色，多个 ID 用逗号分隔")
    @DeleteMapping
    @PreAuthorize("hasAuthority('action#/system/role:delete')")
    public Response<String> deleteRoles(@RequestParam("ids") String ids) {
        roleService.deleteRoles(splitIds(ids));
        return Response.ok("操作成功");
    }

    @Operation(summary = "删除角色", description = "根据角色ID删除角色")
    @DeleteMapping("/{roleId}")
    @PreAuthorize("hasAuthority('action#/system/role:delete')")
    public Response<String> deleteRole(@PathVariable("roleId") String roleId) {
        roleService.deleteRoles(List.of(roleId));
        return Response.ok("操作成功");
    }

    // ===== 兼容旧接口（已废弃，后续版本移除） =====
    @Deprecated
    @Operation(summary = "查询角色详情（旧）", deprecated = true)
    @GetMapping("/detail/{roleId}")
    @PreAuthorize("hasAuthority('menu#/system/role')")
    public Response<RoleBean> queryRoleLegacy(@PathVariable("roleId") String roleId) {
        return Response.ok(roleService.queryRole(roleId));
    }

    @Deprecated
    @Operation(summary = "新增角色（旧）", deprecated = true)
    @PostMapping("/add")
    @PreAuthorize("hasAuthority('action#/system/role:add')")
    public Response<String> addRoleLegacy(@Valid @RequestBody AddRoleReq req) {
        roleService.addRole(req);
        return Response.ok("操作成功");
    }

    @Deprecated
    @Operation(summary = "编辑角色（旧）", deprecated = true)
    @PostMapping("/edit")
    @PreAuthorize("hasAuthority('action#/system/role:edit')")
    public Response<String> editRoleLegacy(@Valid @RequestBody EditRoleReq req) {
        roleService.editRole(req);
        return Response.ok("操作成功");
    }

    private static List<String> splitIds(String ids) {
        return Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .toList();
    }
}
