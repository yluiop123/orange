package com.orange.service.system;

import com.orange.domain.system.group.req.*;
import com.orange.entity.Group;

import java.util.List;

public interface GroupService {
    List<Group> queryGroups(QueryGroupReq req);
    void deleteGroups(List<String> id);
    Group addChild(AddChildGroupReq user);
    Group editGroup(EditGroupReq user);
    Group queryGroup(String id);
    List<Group> queryGroups();
}
