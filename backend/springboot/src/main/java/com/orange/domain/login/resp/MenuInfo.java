package com.orange.domain.login.resp;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Schema(description = "菜单节点")
@Data
public class MenuInfo {

    @Schema(description = "菜单ID", example = "000500")
    private String id;

    @Schema(description = "菜单路径", example = "/system/user")
    private String path;

    @Schema(description = "菜单类型", example = "menu")
    private String type;

    @Schema(description = "菜单名称", example = "用户管理")
    private String name;

    @Schema(description = "子菜单")
    private List<MenuInfo> children = new ArrayList<>();
}
