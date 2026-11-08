package com.orange.controller.login;

import com.orange.domain.common.Response;
import com.orange.domain.login.resp.MenuInfo;
import com.orange.service.system.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "菜单")
@RestController
@RequestMapping("/api/v1/auth")
public class MenuController {

    @Autowired
    private MenuService menuService;

    @Operation(summary = "查询菜单树",
            description = "返回全部启用的菜单和目录，前端按当前角色权限过滤可见性")
    @GetMapping("/menus")
    public Response<List<MenuInfo>> menus(
            @RequestHeader(value = "Locale", required = false) String locale) {
        return Response.ok(menuService.queryMenuTree(locale));
    }
}
