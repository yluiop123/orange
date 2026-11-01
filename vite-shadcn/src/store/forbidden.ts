import { create } from "zustand";

type ForbiddenState = {
  open: boolean;
  path: string;
  message: string;
  show: (path: string, message: string) => void;
  hide: () => void;
};

export const useForbiddenStore = create<ForbiddenState>((set) => ({
  open: false,
  path: "",
  message: "",
  show: (path, message) => set({ open: true, path, message }),
  hide: () => set({ open: false }),
}));
