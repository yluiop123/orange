import { create } from "zustand";

type ForcedPasswordState = {
  required: boolean;
  require: () => void;
  reset: () => void;
};

/**
 * 40302 表示后端要求先修改初始密码，但缓存的 user-info 可能还没更新。
 * 独立标记驱动强制改密对话框；重复的 40302 不会再次触发状态更新。
 */
export const useForcedPasswordStore = create<ForcedPasswordState>((set) => ({
  required: false,
  require: () =>
    set((state) => (state.required ? state : { required: true })),
  reset: () => set((state) => (state.required ? { required: false } : state)),
}));
