import { create } from "zustand";

export type ThemeMode = "dark" | "light";

export interface QuickAddPrefill {
  amount?: number;
  type?: "expense" | "income" | "transfer";
  note?: string;
  date?: string;
  onProcessed?: () => void;
}

interface UIState {
  theme: ThemeMode;
  isQuickAddOpen: boolean;
  quickAddInitialValues?: QuickAddPrefill | null;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  openQuickAdd: (prefill?: QuickAddPrefill | unknown) => void;
  closeQuickAdd: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: "dark",
  isQuickAddOpen: false,
  quickAddInitialValues: null,
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
  openQuickAdd: (prefill) => {
    const isEvent =
      prefill &&
      typeof prefill === "object" &&
      ("nativeEvent" in prefill || "preventDefault" in prefill);
    set({
      isQuickAddOpen: true,
      quickAddInitialValues: isEvent ? null : ((prefill as QuickAddPrefill) ?? null),
    });
  },
  closeQuickAdd: () => set({ isQuickAddOpen: false, quickAddInitialValues: null }),
}));
