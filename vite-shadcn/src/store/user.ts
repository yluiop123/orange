import { sessionHint } from "@/auth/session";
import { authToken } from "@/auth/token";
import axios from "@/lib/axios";
import { ALL_ROLES, computePermissions, type Permission } from "@/store/permission";
import useMenuStore from "@/store/menu";
import { create } from "zustand";

type UserInfo = {
  username?: string;
  email?: string;
  group?: string;
  groupName?: string;
  name?: string;
  mustChangePassword?: boolean;
  roles?: {
    id: string;
    name: string;
  }[];
  rolePermissions?: Permission[];
  userPermissions?: Permission[];
  currentPermission?: Permission[];
  currentRole?: string;
  currentMenuPermission?: string[];
  currentDirectoryPermission?: string[];
};

type GlobalInfo = {
  userInfo: UserInfo | null;
  login: (token: string, expiresIn?: number) => void;
  fetchUser: () => Promise<UserInfo | null>;
  logout: () => void;
  clearSession: () => void;
  updateUserInfo: (userInfo: UserInfo) => void;
};

const ROLE_STORAGE_PREFIX = "orange.currentRole.";

// 服务端渲染没有 localStorage，直接跳过持久化
function readStoredRole(username?: string): string | null {
  if (typeof window === "undefined" || !username) return null;
  return localStorage.getItem(ROLE_STORAGE_PREFIX + username);
}

function writeStoredRole(username: string | undefined, role: string) {
  if (typeof window === "undefined" || !username) return;
  localStorage.setItem(ROLE_STORAGE_PREFIX + username, role);
}

const useUserStore = create<GlobalInfo>()((set, get) => ({
  userInfo: null,
  login: (token: string, expiresIn?: number) => {
    authToken.set(token, expiresIn);
    sessionHint.set();
  },
  fetchUser: async () => {
    const token = authToken.get();
    if (!token) {
      get().logout();
      return null;
    }
    try {
    // 模拟获取用户信息
    const res = await axios.get("/user/userInfo");
    if (res.data.data) {
      const userInfo: UserInfo = res.data.data;
      // 刷新后恢复上次选择的角色；角色已不属于当前用户时回退到“全部”
      const storedRole = readStoredRole(userInfo.username);
      const currentRole =
        storedRole && userInfo.roles?.some((role) => role.id === storedRole)
          ? storedRole
          : ALL_ROLES;
      const nextUserInfo: UserInfo = {
        ...userInfo,
        currentRole,
        ...computePermissions({ ...userInfo, currentRole }),
      };
      set({ userInfo: nextUserInfo });
      return nextUserInfo;
    } else {
      // token 失效等错误
      get().logout();
      return null;
    }
    } catch (error) {
      console.error(error);
      get().logout();
      return null;
    }
  },
  logout: () => {
    // 保留当前 access token 供后端定位用户；即使没有 refresh Cookie 也能吊销
    const currentToken = authToken.get();
    // 先清理本地状态，避免网络异常时卡在已登录界面
    authToken.clear();
    sessionHint.clear();
    set({ userInfo: null });
    useMenuStore.getState().clearMenus();
    // 通知后端递增 token 版本并清 refresh Cookie；失败也不影响本地登出
    axios
      .post("/user/logout", undefined, {
        headers: currentToken
          ? { Authorization: `Bearer ${currentToken}` }
          : undefined,
      })
      .catch(() => {});
  },
  clearSession: () => {
    authToken.clear();
    sessionHint.clear();
    set({ userInfo: null });
    useMenuStore.getState().clearMenus();
  },
  updateUserInfo: (userInfoState) => {
    const userInfo = get().userInfo;
    if (!userInfo) return; // 保护，防止 null

    const currentRole =
      userInfoState.currentRole ?? userInfo.currentRole ?? ALL_ROLES;
    const newUserInfo: UserInfo = {
      ...userInfo,
      ...userInfoState,
      currentRole,
    };

    if (userInfoState.currentRole) {
      writeStoredRole(newUserInfo.username, userInfoState.currentRole);
    }

    set({
      userInfo: {
        ...newUserInfo,
        ...computePermissions(newUserInfo),
      },
    })
  },
}));

export default useUserStore;
