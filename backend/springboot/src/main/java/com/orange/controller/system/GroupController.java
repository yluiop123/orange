package com.orange.controller.system;

import com.orange.domain.common.Response;
import com.orange.domain.common.req.StatusReq;
import com.orange.domain.system.group.req.*;
import com.orange.domain.system.group.resp.GroupBean;
import com.orange.service.system.GroupService;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@Tag(name = "组织管理", description = "组织管理相关接口")
@RestController
@RequestMapping("/api/v1/system/groups")
public class GroupController {
    @Autowired
    private GroupService groupService;

    @Operation(summary = "查询组织列表", description = "支持按 ID、名称、状态过滤")
    @GetMapping
    @PreAuthorize("hasAuthority('menu#/system/group')")
    public Response<List<GroupBean>> queryGroups(@Valid @ModelAttribute QueryGroupReq req) {
        return Response.ok(toBeans(groupService.queryGroups(req)));
    }

    @Operation(summary = "查询组织详情", description = "根据组织ID查询组织详情")
    @GetMapping("/{groupId}")
    @PreAuthorize("hasAuthority('menu#/system/group')")
    public Response<GroupBean> queryGroup(
            @Parameter(description = "组织ID", example = "1")
            @PathVariable("groupId") String groupId) {
        return Response.ok(GroupBean.from(groupService.queryGroup(groupId)));
    }

    @Operation(summary = "编辑组织", description = "根据组织ID更新组织信息")
    @PatchMapping("/{groupId}")
    @PreAuthorize("hasAuthority('action#/system/group:edit')")
    public Response<String> editGroup(@PathVariable("groupId") String groupId,
                                      @Valid @RequestBody EditGroupReq req) {
        req.setId(groupId);
        groupService.editGroup(req);
        return Response.ok("操作成功");
    }

    @Operation(summary = "更新组织状态", description = "启用或禁用组织")
    @PatchMapping("/{groupId}/status")
    @PreAuthorize("hasAuthority('action#/system/group:edit')")
    public Response<String> updateStatus(@PathVariable("groupId") String groupId,
                                         @Valid @RequestBody StatusReq req) {
        EditGroupReq editReq = new EditGroupReq();
        editReq.setId(groupId);
        editReq.setStatus(req.getStatus());
        groupService.editGroup(editReq);
        return Response.ok("操作成功");
    }

    @Operation(summary = "删除组织", description = "根据组织ID列表删除组织，多个 ID 用逗号分隔")
    @DeleteMapping
    @PreAuthorize("hasAuthority('action#/system/group:delete')")
    public Response<String> deleteGroups(@RequestParam("ids") String ids) {
        groupService.deleteGroups(splitIds(ids));
        return Response.ok("操作成功");
    }

    @Operation(summary = "删除组织", description = "根据组织ID删除组织")
    @DeleteMapping("/{groupId}")
    @PreAuthorize("hasAuthority('action#/system/group:delete')")
    public Response<String> deleteGroup(@PathVariable("groupId") String groupId) {
        groupService.deleteGroups(List.of(groupId));
        return Response.ok("操作成功");
    }

    @Operation(summary = "添加子组织", description = "在指定父组织下添加子组织")
    @PostMapping("/children")
    @PreAuthorize("hasAuthority('action#/system/group:add')")
    public Response<GroupBean> addChild(@Valid @RequestBody AddChildGroupReq req) {
        return Response.ok(GroupBean.from(groupService.addChild(req)));
    }

    // ===== 兼容旧接口（已废弃，后续版本移除） =====
    @Deprecated
    @Hidden
    @Operation(summary = "查询组织列表（旧）", deprecated = true)
    @PostMapping
    @PreAuthorize("hasAuthority('menu#/system/group')")
    public Response<List<GroupBean>> queryGroupsLegacy(@Valid @RequestBody QueryGroupReq req) {
        return Response.ok(toBeans(groupService.queryGroups(req)));
    }

    @Deprecated
    @Hidden
    @Operation(summary = "查询组织详情（旧）", deprecated = true)
    @GetMapping("/detail/{groupId}")
    @PreAuthorize("hasAuthority('menu#/system/group')")
    public Response<GroupBean> queryGroupLegacy(@PathVariable("groupId") String groupId) {
        return Response.ok(GroupBean.from(groupService.queryGroup(groupId)));
    }

    @Deprecated
    @Hidden
    @Operation(summary = "编辑组织（旧）", deprecated = true)
    @PostMapping("/edit")
    @PreAuthorize("hasAuthority('action#/system/group:edit')")
    public Response<String> editGroupLegacy(@Valid @RequestBody EditGroupReq req) {
        groupService.editGroup(req);
        return Response.ok("操作成功");
    }

    @Deprecated
    @Hidden
    @Operation(summary = "添加子组织（旧）", deprecated = true)
    @PostMapping("/addChild")
    @PreAuthorize("hasAuthority('action#/system/group:add')")
    public Response<GroupBean> addChildLegacy(@Valid @RequestBody AddChildGroupReq req) {
        return Response.ok(GroupBean.from(groupService.addChild(req)));
    }

    private static List<GroupBean> toBeans(List<com.orange.entity.Group> groups) {
        return groups.stream().map(GroupBean::from).toList();
    }

    private static List<String> splitIds(String ids) {
        return Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .toList();
    }
}
