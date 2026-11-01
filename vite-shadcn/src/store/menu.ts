import axios from "@/lib/axios";
import type { MenuNode } from "@/types/menu";
import { create } from "zustand";

type MenuState = {
  menus: MenuNode[];
  loading: boolean;
  loaded: boolean;
  error: boolean;
  fetchMenus: () => Promise<void>;
  clearMenus: () => void;
};

const useMenuStore = create<MenuState>()((set, get) => ({
  menus: [],
  loading: false,
  loaded: false,
  error: false,
  fetchMenus: async () => {
    if (get().loading) return;
    set({ loading: true, error: false });
    try {
      const res = await axios.get("/user/menus");
      set({
        menus: res.data.data ?? [],
        loading: false,
        loaded: true,
        error: false,
      });
    } catch (error) {
      console.error(error);
      set({ loading: false, error: true });
    }
  },
  clearMenus: () =>
    set({ menus: [], loading: false, loaded: false, error: false }),
}));

export default useMenuStore;
