package com.orange.controller.system;

import com.orange.domain.common.PageData;
import com.orange.domain.common.Response;
import com.orange.domain.common.req.StatusReq;
import com.orange.domain.system.user.req.AddUserReq;
import com.orange.domain.system.user.req.EditUserReq;
import com.orange.domain.system.user.req.QueryUserReq;
import com.orange.domain.system.user.resp.UserBean;
import com.orange.service.system.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@Tag(name = "用户管理", description = "用户管理相关接口")
@RestController
@RequestMapping("/api/system/users")
public class UserController {
    @Autowired
    private UserService userService;

    @Operation(summary = "查询用户列表", description = "支持分页、过滤和排序")
    @GetMapping
    @PreAuthorize("hasAuthority('menu#/system/user')")
    public Response<PageData<UserBean>> queryUsers(@Valid @ModelAttribute QueryUserReq req) {
        PageData<UserBean> pageData = userService.queryUsers(req);
        return Response.ok(pageData);
    }

    @Operation(summary = "查询用户详情", description = "根据用户ID查询用户详情")
    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('menu#/system/user')")
    public Response<UserBean> queryUser(@Parameter(description = "用户ID") @PathVariable("userId") String userId) {
        UserBean user = userService.queryUser(userId);
        return Response.ok(user);
    }

    @Operation(summary = "新增用户", description = "根据用户信息新增用户")
    @PostMapping
    @PreAuthorize("hasAuthority('action#/system/user:add')")
    public Response<String> addUser(@Valid @RequestBody AddUserReq user) {
        String tempPassword = userService.addUser(user);
        return Response.ok("操作成功", tempPassword);
    }

    @Operation(summary = "编辑用户", description = "根据用户ID更新用户信息")
    @PatchMapping("/{userId}")
    @PreAuthorize("hasAuthority('action#/system/user:edit')")
    public Response<String> editUser(@PathVariable("userId") String userId, @Valid @RequestBody EditUserReq user) {
        user.setId(userId);
        userService.editUser(user);
        return Response.ok("操作成功");
    }

    @Operation(summary = "更新用户状态", description = "启用或禁用用户")
    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasAuthority('action#/system/user:edit')")
    public Response<String> updateStatus(@PathVariable("userId") String userId, @Valid @RequestBody StatusReq req) {
        EditUserReq user = new EditUserReq();
        user.setId(userId);
        user.setStatus(req.getStatus());
        userService.editUser(user);
        return Response.ok("操作成功");
    }

    @Operation(summary = "重置用户密码", description = "根据用户ID重置用户密码")
    @PostMapping("/{userId}/reset-password")
    @PreAuthorize("hasAuthority('action#/system/user:edit')")
    public Response<String> resetUser(@Parameter(description = "用户ID") @PathVariable("userId") String userId,
                                      HttpServletResponse response) {
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        return Response.ok("操作成功", userService.resetUser(userId));
    }

    @Operation(summary = "删除用户", description = "根据用户ID删除用户")
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAuthority('action#/system/user:delete')")
    public Response<String> deleteUser(@PathVariable("userId") String userId) {
        userService.deleteUsers(List.of(userId));
        return Response.ok("删除成功");
    }

    @Operation(summary = "批量删除用户", description = "根据用户ID列表删除用户，多个 ID 用逗号分隔")
    @DeleteMapping
    @PreAuthorize("hasAuthority('action#/system/user:delete')")
    public Response<String> deleteUsers(@RequestParam("ids") String ids) {
        userService.deleteUsers(splitIds(ids));
        return Response.ok("删除成功");
    }

    // ===== 兼容旧接口（已废弃，后续版本移除） =====
    @Deprecated
    @Operation(summary = "查询用户详情（旧）", deprecated = true)
    @GetMapping("/detail/{userId}")
    @PreAuthorize("hasAuthority('menu#/system/user')")
    public Response<UserBean> queryUserLegacy(@PathVariable("userId") String userId) {
        return Response.ok(userService.queryUser(userId));
    }

    @Deprecated
    @Operation(summary = "新增用户（旧）", deprecated = true)
    @PostMapping("/add")
    @PreAuthorize("hasAuthority('action#/system/user:add')")
    public Response<String> addUserLegacy(@Valid @RequestBody AddUserReq user) {
        String tempPassword = userService.addUser(user);
        return Response.ok("操作成功", tempPassword);
    }

    @Deprecated
    @Operation(summary = "编辑用户（旧）", deprecated = true)
    @PostMapping("/edit")
    @PreAuthorize("hasAuthority('action#/system/user:edit')")
    public Response<String> editUserLegacy(@Valid @RequestBody EditUserReq user) {
        userService.editUser(user);
        return Response.ok("操作成功");
    }

    @Deprecated
    @Operation(summary = "重置用户密码（旧）", deprecated = true)
    @PostMapping("/reset/{userId}")
    @PreAuthorize("hasAuthority('action#/system/user:edit')")
    public Response<String> resetUserLegacy(@PathVariable("userId") String userId) {
        return Response.ok("操作成功", userService.resetUser(userId));
    }

    private static List<String> splitIds(String ids) {
        return Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .toList();
    }
}
