import { create } from "zustand";
const defaultTheme = {
  mode: "dark" as Mode,
  color: "default" as Color,
}
export type Mode = "light" | "dark";
export type Color =
  | "default"
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "rose"
  | "violet"
  | "yellow";
interface ThemeStore {
  mode: Mode;
  color: Color;
  initTheme: () => void;
  setMode: (m: Mode) => void;
  setColor: (c: Color) => void;
}
function getInitialMode(): Mode {
  if (typeof window === "undefined"){
    localStorage.setItem("theme-mode", defaultTheme.mode);
    return defaultTheme.mode;
  } else if (!localStorage.getItem("theme-mode")) {
    localStorage.setItem("theme-mode", defaultTheme.mode);
    return defaultTheme.mode;
  }else{
    return localStorage.getItem("theme-mode") as Mode;  
  }
}

function getInitialColor(): Color {
  if (typeof window === "undefined"){
    localStorage.setItem("theme-color", defaultTheme.color);
    return defaultTheme.color;
  }else if (!localStorage.getItem("theme-color")) {
    localStorage.setItem("theme-color", defaultTheme.color);
    return defaultTheme.color;
  }else{
    return (localStorage.getItem("theme-color") as Color) || defaultTheme.color;
  }
}
function setModeColor(color: Color, mode: Mode): void {
  const root = document.documentElement;
  // 移除旧主题类
  // Array.from(root.classList)
  //   .filter((c) => c.startsWith("theme-"))
  //   .forEach((c) => root.classList.remove(c));
  // if (color === "default") {
  //   document.documentElement.classList.toggle("dark", mode === "dark");
  // } else {
  //   let themeColor: string = `theme-${color}`;
  //   if (mode === "dark") {
  //     themeColor += "-dark";
  //   }
  //   document.documentElement.classList.add(themeColor);
  // }
if (typeof window === "undefined") return;
  // 1. 处理 Mode
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // 2. 处理 Color
  // 先移除所有以 theme- 开头的类
  const themesToRemove = Array.from(root.classList).filter((c) => c.startsWith("theme-"));
  root.classList.remove(...themesToRemove);

  // 如果不是默认主题，则添加对应类名
  if (color !== "default") {
    root.classList.add(`theme-${color}`);
  }
}
const useThemeStore = create<ThemeStore>((set, get) => {
  const initTheme = () => {
    const mode = getInitialMode();
    const color = getInitialColor();
    setModeColor(color, mode);
    return {mode,color};
  };

  // 初始执行一次
  const {mode,color} = initTheme();
  return {
    mode: mode, // 默认值，仅作为占位
    color: color,
    setMode: (mode) => {
      const color = get().color;
      setModeColor(color, mode);
      localStorage.setItem("theme-mode", mode);
      set({ mode });
    },
    setColor: (color) => {
      setModeColor(color, get().mode);
      localStorage.setItem("theme-color", color);
      set({ color });
    },
    initTheme,
  };
});
export default useThemeStore;
