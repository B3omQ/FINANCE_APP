import { create } from "zustand";

export type ThemeMode = "dark" | "light";

interface UIState {
  theme: ThemeMode;
  isQuickAddOpen: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: "dark",
  isQuickAddOpen: false,
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next === "dark");
        document.documentElement.classList.toggle("light", next === "light");
      }
      return { theme: next };
    }),
  setTheme: (theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.classList.toggle("light", theme === "light");
    }
    set({ theme });
  },
  openQuickAdd: () => set({ isQuickAddOpen: true }),
  closeQuickAdd: () => set({ isQuickAddOpen: false }),
}));
