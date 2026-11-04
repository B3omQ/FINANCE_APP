import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useUIStore } from "@/store/uiStore";
import { useThemeStore } from "@/store/themeStore";
import { ToastProvider, useToast } from "@/shared/ui/Toast";
import { QuickAddDialog } from "@/features/transactions/components/QuickAddDialog";
import { useTransactions } from "@/features/transactions/useTransactions";
import { useRecurringAutoProcess } from "@/features/recurring/useRecurringAutoProcess";
import { useRepositories } from "./providers";
import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@/shared/lib/formatMoney";
import { UserProfileModal } from "@/features/settings/components/UserProfileModal";
import { WelcomeOnboardingModal } from "@/features/settings/components/WelcomeOnboardingModal";
import {
  ArrowUpDown,
  Camera,
  Database,
  LayoutDashboard,
  Moon,
  MoreHorizontal,
  Palette,
  PieChart,
  Plus,
  Repeat,
  ShieldCheck,
  Sun,
  Tag,
  Target,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";

const NAV_ITEMS = [
  { path: "/", label: "Tổng quan", icon: LayoutDashboard },
  { path: "/transactions", label: "Sổ giao dịch", icon: ArrowUpDown },
  { path: "/accounts", label: "Tài khoản & Ví", icon: Wallet },
  { path: "/categories", label: "Phân loại", icon: Tag },
  { path: "/budgets", label: "Ngân sách", icon: PieChart },
  { path: "/goals", label: "Mục tiêu tích lũy", icon: Target },
  { path: "/recurring", label: "Định kỳ tự động", icon: Repeat },
  { path: "/settings", label: "Tùy biến & Giao diện", icon: Palette },
];

function AppLayout() {
  const { isQuickAddOpen, quickAddInitialValues, openQuickAdd, closeQuickAdd } = useUIStore();
  const { config, avatarUrl, bgImageUrl, isInitialized, initTheme, setThemeMode, setUserName } = useThemeStore();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const location = useLocation();
  const repos = useRepositories();
  const { showToast } = useToast();
  const { createTransaction, createTransfer } = useTransactions();

  // Initialize theme, fonts, CSS variables & indexedDB media assets on app start
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Auto-process due recurring rules on app launch
  useRecurringAutoProcess();

  // Queries for Quick Add dialog
  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: () => repos.accounts.list(),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => repos.categories.list(),
  });

  const accounts = accountsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  // Global 'N' keyboard shortcut to open Quick Add (unless focus is in input/textarea/select)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.key === "n" || e.key === "N") &&
        !isQuickAddOpen &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        )
      ) {
        e.preventDefault();
        openQuickAdd();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isQuickAddOpen, openQuickAdd]);

  async function handleQuickAddTransaction(data: Parameters<typeof createTransaction>[0]) {
    await createTransaction(data);
    if (quickAddInitialValues?.onProcessed) {
      quickAddInitialValues.onProcessed();
    }
    showToast({
      message: `Đã ghi nhận ${formatMoney(Math.abs(data.amount))}!`,
      type: "success",
    });
  }

  async function handleQuickAddTransfer(data: Parameters<typeof createTransfer>[0]) {
    await createTransfer(data);
    showToast({
      message: `Đã chuyển ${formatMoney(data.amount)} thành công!`,
      type: "success",
    });
  }

  const toggleThemeMode = () => {
    setThemeMode(config.mode === "light" ? "dark" : "light");
  };

  const hasWallpaper = Boolean(config.bgSettings.hasImage && bgImageUrl);

  // Initial Loading Screen while initializing media and theme
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 antialiased select-none">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary shadow-xl shadow-primary/20 animate-pulse">
            <ShieldCheck size={32} className="stroke-[2.2]" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] animate-bounce">
            •
          </span>
        </div>
        <div className="font-extrabold text-lg tracking-tight mb-2">FINANCE VAULT</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <span>Đang khởi tạo không gian tài chính...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/25 selection:text-primary relative",
        hasWallpaper && "has-bg-wallpaper"
      )}
    >
      {/* Background Wallpaper Layer (IndexedDB image with custom blur and overlay) */}
      {hasWallpaper && (
        <>
          <div
            className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
            style={{
              backgroundImage: `url(${bgImageUrl})`,
              backgroundSize: config.bgSettings.objectFit,
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundAttachment: config.bgSettings.isFixed ? "fixed" : "scroll",
              filter: `blur(${config.bgSettings.blur}px)`,
              transform: "scale(1.04)", // Prevents blur edge clipping
            }}
          />
          <div
            className="fixed inset-0 pointer-events-none z-0 transition-colors duration-300"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${config.bgSettings.overlayOpacity / 100})`,
            }}
          />
        </>
      )}

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Desktop Sidebar (>= 1024px) */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border/60 bg-card/75 backdrop-blur-xl shrink-0 select-none">
          {/* Logo & Brand identity: Avatar + User Display Name */}
          <div className="p-5 pb-3 border-b border-border/40">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 group text-left w-full cursor-pointer"
              title="Nhấn để đổi tên hoặc ảnh đại diện"
            >
              <div className="relative shrink-0">
                <div
                  className="h-10 w-10 rounded-xl overflow-hidden border-2 border-primary/60 flex items-center justify-center font-bold text-base text-primary-foreground shadow-md bg-card group-hover:scale-105 group-hover:border-primary transition-all"
                  style={{
                    boxShadow: "0 6px 18px -4px hsl(var(--primary) / 0.45)",
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/15 flex items-center justify-center text-primary">
                      <User size={20} className="stroke-[2.2]" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] shadow opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={9} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-extrabold text-sm tracking-tight text-foreground block group-hover:text-primary transition-colors truncate">
                  {config.userName || "FINANCE VAULT"}
                </span>
                <span className="text-[10px] font-mono tracking-wider text-primary flex items-center gap-1.5 uppercase mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Offline SQLite
                </span>
              </div>
            </button>

            {/* Quick Access to Theme Settings */}
            <Link
              to="/settings"
              className="mt-3.5 flex items-center justify-between p-2 rounded-xl bg-secondary/40 hover:bg-secondary/70 border border-border/40 transition-colors group"
              title="Đi tới Tùy biến giao diện & chủ đề"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Palette size={14} className="text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground truncate">Tùy biến chủ đề</span>
              </div>
              <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors font-medium">
                Cài đặt →
              </span>
            </Link>
          </div>

          {/* Quick Add CTA in sidebar */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={openQuickAdd}
              className="w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all border border-white/10"
            >
              <div className="flex items-center gap-2">
                <Plus size={16} className="stroke-[2.5]" />
                <span>Giao dịch mới</span>
              </div>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/15 text-primary-foreground/90 border border-black/10">
                N
              </kbd>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                    isActive
                      ? "bg-primary/12 text-primary font-semibold border border-primary/20 shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon
                    size={16}
                    className={cn(
                      "transition-colors",
                      isActive
                        ? "text-primary stroke-[2.2]"
                        : "text-muted-foreground/80 group-hover:text-foreground"
                    )}
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer with system info and theme switch */}
          <div className="p-3.5 border-t border-border/40 space-y-2 bg-card/40">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span className="flex items-center gap-1.5">
                <Database size={12} className="text-primary" />
                <span>Bộ nhớ SQLite</span>
              </span>
              <button
                type="button"
                onClick={toggleThemeMode}
                className="p-1.5 rounded-lg border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title={`Đổi giao diện (Hiện tại: ${config.mode})`}
              >
                {config.mode === "light" ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-24 lg:pb-8">
          {/* Top Mobile Header (< 1024px) with safe area spacing for Android status bar / punch hole */}
          <header className="lg:hidden flex items-center justify-between px-4 pt-safe-top pb-3.5 border-b border-border/60 bg-card/85 backdrop-blur-xl shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3.5 text-left group cursor-pointer"
              title="Nhấn để đổi tên hoặc ảnh đại diện"
            >
              <div className="relative shrink-0">
                <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden border-2 border-primary/80 flex items-center justify-center bg-card shadow-md group-hover:border-primary group-hover:scale-105 transition-all">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary">
                      <User size={32} className="stroke-[2.2]" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] shadow-md border-2 border-card">
                  <Camera size={12} />
                </div>
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-base tracking-tight block truncate max-w-[200px]">
                  {config.userName || "FINANCE VAULT"}
                </span>
                <span className="text-[10px] text-primary font-mono font-semibold block mt-0.5">
                  LOCAL DB • OFFLINE
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={toggleThemeMode}
              className="w-[60px] h-[60px] rounded-2xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
              aria-label="Đổi chế độ sáng tối"
              title={`Đổi giao diện (Hiện tại: ${config.mode})`}
            >
              {config.mode === "light" ? <Sun size={24} className="stroke-[2.2]" /> : <Moon size={24} className="stroke-[2.2]" />}
            </button>
          </header>

          {/* Page Outlet with smooth hardware-accelerated transition */}
          <main key={location.pathname} className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 page-fade-in">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile More Popover Menu (< 1024px) */}
      {isMoreMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div
            className="absolute bottom-20 right-3 left-3 bg-card border border-white/10 rounded-2xl p-3 shadow-2xl space-y-1 animate-in slide-in-from-bottom-3 duration-150 backdrop-blur-xl pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 mb-1">
              Tính năng mở rộng
            </div>
            {NAV_ITEMS.slice(4).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[48px]",
                    isActive
                      ? "bg-primary/15 text-primary font-bold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary/70 text-muted-foreground"
                    )}
                  >
                    <Icon size={20} className={isActive ? "stroke-[2.4]" : "stroke-[2]"} />
                  </div>
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar (< 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border/60 px-2 pt-1.5 pb-safe flex items-center justify-around shadow-2xl">
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-1.5 rounded-xl transition-all active:scale-90 min-w-[56px] min-h-[48px] select-none text-center",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={22} className={isActive ? "stroke-[2.5]" : "stroke-[1.9]"} />
              <span
                className={cn(
                  "text-[10px] leading-tight text-center tracking-tight block max-w-[62px] whitespace-normal break-words",
                  isActive ? "font-bold text-primary" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* 5th Tab: "Thêm" Menu */}
        <button
          type="button"
          onClick={() => setIsMoreMenuOpen((prev) => !prev)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-1 px-1.5 rounded-xl transition-all active:scale-90 min-w-[56px] min-h-[48px] select-none text-center",
            NAV_ITEMS.slice(4).some((item) => item.path === location.pathname) || isMoreMenuOpen
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MoreHorizontal size={22} className={isMoreMenuOpen ? "stroke-[2.6]" : "stroke-[1.9]"} />
          <span
            className={cn(
              "text-[10px] leading-tight text-center tracking-tight block max-w-[62px]",
              isMoreMenuOpen ? "font-bold text-primary" : "font-medium"
            )}
          >
            Thêm
          </span>
        </button>
      </nav>

      {/* Floating Action Button (+) with Signature Pill Shape */}
      <button
        type="button"
        onClick={openQuickAdd}
        aria-label="Thêm giao dịch nhanh"
        className="fixed bottom-safe-fab right-5 lg:bottom-7 lg:right-7 z-40 flex items-center gap-2 py-3 px-4 rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all focus:outline-none border border-white/20 min-h-[48px]"
      >
        <Plus size={22} className="stroke-[2.8]" />
        <span className="hidden sm:inline">Giao dịch</span>
        <kbd className="hidden sm:inline text-[9px] font-mono px-1 py-0.5 rounded bg-black/15 text-primary-foreground/90">
          N
        </kbd>
      </button>

      {/* Quick Add Dialog */}
      <QuickAddDialog
        isOpen={isQuickAddOpen}
        onClose={closeQuickAdd}
        accounts={accounts}
        categories={categories}
        onSubmitTransaction={handleQuickAddTransaction}
        onSubmitTransfer={handleQuickAddTransfer}
        initialValues={quickAddInitialValues}
      />

      {/* User Profile & Avatar Modal (Accessible by clicking avatar/name on PC or Mobile) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Welcome Onboarding Modal if user name is not yet set */}
      {isInitialized && (!config.userName || config.userName.trim() === "") && (
        <WelcomeOnboardingModal
          onComplete={(name) => {
            setUserName(name);
            showToast({
              message: `Chào mừng ${name} đến với không gian tài chính!`,
              type: "success",
            });
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppLayout />
    </ToastProvider>
  );
}
