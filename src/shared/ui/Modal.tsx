import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  // Push history state to intercept Android hardware back button / gesture & Escape key
  useEffect(() => {
    if (!isOpen) return;

    // Prevent background page scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";

    const stateObj = { modalActive: true, timestamp: Date.now() };
    window.history.pushState(stateObj, "");

    function handlePopState() {
      onClose();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalNode = (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden pointer-events-auto">
      {/* Backdrop with lightweight GPU fade (avoids heavy blur lag on mobile webviews) */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-[2px] animate-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog / Bottom-Sheet content */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[101] w-full max-w-lg rounded-t-3xl sm:rounded-2xl border-t sm:border border-border/80 bg-card shadow-2xl animate-modal-sheet sm:animate-modal-desktop max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden pb-safe"
      >
        {/* Mobile drag handle bar */}
        <div className="pt-2.5 pb-1 sm:hidden flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-3 border-b border-border/40 shrink-0 relative flex items-start justify-between gap-4">
          <div className="min-w-0 pr-8">
            {title && (
              <h2 className="text-base font-bold tracking-tight text-foreground truncate">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="absolute right-4 top-3.5 p-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 z-10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body with thumb-friendly bottom safe space */}
        <div
          className={cn(
            "overflow-y-auto flex-1 overscroll-contain px-5 py-4 pb-12 sm:pb-6 pr-4",
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );

  // Mount at body root via Portal to break free of any parent stacking context (e.g. z-10 app layout)
  if (typeof document !== "undefined") {
    return createPortal(modalNode, document.body);
  }

  return modalNode;
}
