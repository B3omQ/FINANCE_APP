import { Outlet } from "react-router-dom";
import { useUIStore } from "@/store/uiStore";
import { Moon, Sun } from "lucide-react";

export default function App() {
  const { theme, toggleTheme } = useUIStore();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <header className="border-b border-border/40 px-6 py-3 flex items-center justify-between bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
            FA
          </div>
          <span className="font-semibold text-sm tracking-wide">Finance App</span>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Đổi giao diện sáng/tối"
          className="p-2 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
