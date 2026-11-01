package com.orange.service.system;

import com.orange.domain.login.resp.MenuInfo;

import java.util.List;

public interface MenuService {
    List<MenuInfo> queryMenuTree();
}
