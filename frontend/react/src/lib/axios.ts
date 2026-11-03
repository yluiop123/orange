import { sessionHint } from "@/auth/session";
import { authToken } from "@/auth/token";
import { notify } from "@/lib/notify";
import { useForcedPasswordStore } from "@/store/forced-password";
import { useForbiddenStore } from "@/store/forbidden";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_API = import.meta.env.VITE_BASE_API || "/api/v1/";

const instance = axios.create({
  baseURL: BASE_API, // 根据环境配置
  timeout: 10000,
  // refresh token 走 HttpOnly Cookie，跨域时需要携带凭证
  withCredentials: true,
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function isAuthEndpoint(url?: string) {
  // 兼容 "auth/login"、"/api/v1/auth/login" 等写法
  return !!url && /(?:^|\/)auth\/(login|refresh|logout)(?:\?|$)/.test(url);
}

let refreshing: Promise<string | null> | null = null;

/**
 * 并发 401 只触发一次 refresh。
 * 注意：这里使用同一个 axios 实例，但 refresh 请求本身不会再触发刷新逻辑。
 */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = instance
      .post("/auth/refresh")
      .then((res) => {
        const data = res.data?.data;
        const token = data?.token ?? null;
        authToken.set(token, data?.expiresIn);
        if (!token) {
          sessionHint.clear();
        }
        return token;
      })
      .catch(() => {
        authToken.clear();
        sessionHint.clear();
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

instance.interceptors.request.use(
  async (config) => {
    // 临近过期时先刷新，避免业务请求先吃一次 401
    if (authToken.isExpiring() && !isAuthEndpoint(config.url)) {
      const token = await refreshAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // 如果是 FormData，取消默认的 json header 设置
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }

    // access token 只从内存读取
    const token = authToken.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const locale =
      localStorage.getItem("locale") || navigator.language.split("-")[0];
    if (locale) {
      config.headers["Locale"] = locale;
    }
    return config;
  },
  (error: AxiosError) => {
    notify.error(error.message || "请求发送失败");
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    const data = response.data;
    // 统一按业务 code 判断，40001 不再被视为成功
    if (
      data &&
      typeof data === "object" &&
      "code" in data &&
      data.code !== 200
    ) {
      notify.error(data.message || "请求错误");
      return Promise.reject(data);
    }
    return response;
  },
  async (error: AxiosError) => {
    // 主动取消（切换分页/筛选、组件卸载）不是错误，不弹提示
    if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    const original = error.config as RetryConfig | undefined;
    const url = original?.url;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthEndpoint(url)
    ) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return instance(original);
      }
      notify.error("登录已过期，请重新登录");
      return Promise.reject(error);
    }

    // 登录/刷新/登出接口的失败由调用方处理，不重复弹提示
    if (!isAuthEndpoint(url)) {
      const data = error.response?.data as
        | { code?: number; message?: string }
        | undefined;
      if (error.response?.status === 403) {
        // 40302 是“请先修改初始密码”，由强制改密对话框处理。
        // 登录/刷新接口已在上面排除，避免登录请求触发强制改密。
        if (data?.code === 40302) {
          useForcedPasswordStore.getState().require();
        } else {
          useForbiddenStore
            .getState()
            .show(url ?? "", data?.message || "没有执行该操作的权限");
        }
        return Promise.reject(error);
      }
      notify.error(data?.message || error.message || "网络异常");
    }
    return Promise.reject(error);
  }
);

export default instance;
