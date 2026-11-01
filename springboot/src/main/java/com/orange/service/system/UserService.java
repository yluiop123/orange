package com.orange.service.system;

import com.orange.domain.common.PageData;
import com.orange.domain.login.resp.UserInfo;
import com.orange.domain.system.user.req.AddUserReq;
import com.orange.domain.system.user.req.EditUserReq;
import com.orange.domain.system.user.req.QueryUserReq;
import com.orange.domain.system.user.resp.UserBean;
import com.orange.entity.User;

import java.util.List;

public interface UserService {
    PageData<UserBean> queryUsers(QueryUserReq req);
    String addUser(AddUserReq user);
    User editUser(EditUserReq user);
    void deleteUsers(List<String> id);
    String resetUser(String id);
    void changePassword(String username, String oldPassword, String newPassword);
    void revokeTokens(String username);
    UserBean queryUser(String id);

    UserInfo queryUserInfo(String username);
}
