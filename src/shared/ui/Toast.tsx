import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface ToastOptions {
  message: string;
  type?: "info" | "success" | "error";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [activeToast, setActiveToast] = useState<ToastItem | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitAnimationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Smooth dismiss with 180ms exit animation
  const triggerClose = useCallback(() => {
    if (isClosing) return;

    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }

    setIsClosing(true);

    exitAnimationTimerRef.current = setTimeout(() => {
      setActiveToast(null);
      setIsClosing(false);
      exitAnimationTimerRef.current = null;
    }, 180);
  }, [isClosing]);

  const showToast = useCallback((options: ToastOptions) => {
    // Clear any pending timers from previous toast
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    if (exitAnimationTimerRef.current) {
      clearTimeout(exitAnimationTimerRef.current);
      exitAnimationTimerRef.current = null;
    }

    const id = Math.random().toString(36).substring(2, 9);
    const defaultDuration = options.action ? 4500 : 2500;
    const duration = options.duration ?? defaultDuration;

    setIsClosing(false);
    setActiveToast({ ...options, id });

    autoDismissTimerRef.current = setTimeout(() => {
      triggerClose();
    }, duration);
  }, [triggerClose]);

  useEffect(() => {
    return () => {
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
      if (exitAnimationTimerRef.current) clearTimeout(exitAnimationTimerRef.current);
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  const toastPortal = activeToast ? (
    <div className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center p-4">
      {/* Backdrop: Clicking outside the popup triggers smooth dismissal */}
      <div
        className={cn(
          "fixed inset-0 pointer-events-auto bg-black/35 backdrop-blur-[1.5px] cursor-pointer",
          isClosing ? "animate-backdrop-out" : "animate-backdrop"
        )}
        onClick={triggerClose}
        aria-hidden="true"
      />

      {/* Center Small HUD Popup */}
      <div
        key={activeToast.id}
        onClick={(e) => e.stopPropagation()} // Prevent inside clicks from closing unexpectedly unless desired
        role="status"
        aria-live="polite"
        className={cn(
          "relative z-10 pointer-events-auto flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border shadow-2xl backdrop-blur-xl bg-card/95 select-none max-w-[280px] sm:max-w-[320px] w-full min-w-[220px]",
          "border-border/80 shadow-[0_20px_50px_rgba(0,0,0,0.65)]",
          activeToast.type === "error" && "border-rose-500/35 bg-rose-950/25",
          activeToast.type === "success" && "border-emerald-500/35 bg-emerald-950/25",
          isClosing ? "animate-hud-popup-out" : "animate-hud-popup"
        )}
      >
        {/* Status Icon with Ambient Glow */}
        <div className="mb-2 shrink-0">
          {activeToast.type === "error" ? (
            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <AlertCircle size={26} className="stroke-[2.4]" />
            </div>
          ) : activeToast.type === "info" ? (
            <div className="w-12 h-12 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Info size={26} className="stroke-[2.4]" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={26} className="stroke-[2.4]" />
            </div>
          )}
        </div>

        {/* Message */}
        <p className="text-xs sm:text-sm font-semibold text-foreground tracking-tight leading-relaxed px-1">
          {activeToast.message}
        </p>

        {/* Optional Action Button */}
        {activeToast.action && (
          <div className="mt-2.5 pt-2.5 border-t border-border/40 w-full flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                activeToast.action?.onClick();
                triggerClose();
              }}
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/30 min-h-[36px]"
            >
              {activeToast.action.label}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerClose();
              }}
              className="p-1 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
              aria-label="Đóng"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" && toastPortal
        ? createPortal(toastPortal, document.body)
        : toastPortal}
    </ToastContext.Provider>
  );
}
