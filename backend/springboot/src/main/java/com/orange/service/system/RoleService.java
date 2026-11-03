package com.orange.service.system;

import com.orange.domain.common.PageData;
import com.orange.domain.system.role.req.AddRoleReq;
import com.orange.domain.system.role.req.EditRoleReq;
import com.orange.domain.system.role.req.QueryRoleReq;
import com.orange.domain.system.role.resp.RoleBean;
import com.orange.entity.Role;

import java.util.List;

public interface RoleService {
    PageData<RoleBean> queryRoles(QueryRoleReq req);
    Role addRole(AddRoleReq role);
    Role editRole(EditRoleReq role);
    void deleteRoles(List<String> id);
    RoleBean queryRole(String id);
}
