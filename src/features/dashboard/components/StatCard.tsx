import React from "react";
import { formatMoney } from "@/shared/lib/formatMoney";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface StatCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  variant: "income" | "expense" | "net";
  diffPercent?: number;
  prevAmount?: number;
}

export function StatCard({
  title,
  amount,
  icon: Icon,
  variant,
  diffPercent,
  prevAmount,
}: StatCardProps) {
  const isPositiveDiff = (diffPercent ?? 0) > 0;
  const isZeroDiff = (diffPercent ?? 0) === 0;
  const isNet = variant === "net";

  return (
    <div
      className={cn(
        "p-5 rounded-2xl transition-all duration-200 relative overflow-hidden",
        isNet ? "fin-hero-card" : "fin-card"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
          {title}
        </span>
        <div
          className={cn(
            "h-9 w-9 rounded-xl flex items-center justify-center border",
            variant === "income" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            variant === "expense" && "bg-rose-500/10 text-rose-400 border-rose-500/20",
            variant === "net" && "bg-primary/15 text-primary border-primary/30"
          )}
        >
          <Icon size={18} className="stroke-[2.2]" />
        </div>
      </div>

      <div className="mt-3.5">
        <div
          className={cn(
            "text-2xl sm:text-3xl font-extrabold font-tabular tracking-tight",
            variant === "income" && "text-emerald-400",
            variant === "expense" && "text-rose-400",
            variant === "net" && (amount >= 0 ? "text-foreground" : "text-rose-400")
          )}
        >
          {variant === "net" && amount > 0 && "+"}
          {formatMoney(amount)}
        </div>
      </div>

      {diffPercent !== undefined && (
        <div className="flex items-center gap-2 mt-3 text-xs flex-wrap">
          {isZeroDiff ? (
            <span className="fin-badge bg-muted text-muted-foreground border border-border/50">
              <Minus size={11} />
              <span>0%</span>
            </span>
          ) : isPositiveDiff ? (
            <span
              className={cn(
                "fin-badge",
                variant === "expense"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              )}
            >
              <ArrowUpRight size={12} className="stroke-[2.5]" />
              <span>+{Math.abs(diffPercent)}%</span>
            </span>
          ) : (
            <span
              className={cn(
                "fin-badge",
                variant === "expense"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              )}
            >
              <ArrowDownRight size={12} className="stroke-[2.5]" />
              <span>-{Math.abs(diffPercent)}%</span>
            </span>
          )}
          <span className="text-[11px] text-muted-foreground/80 font-medium">
            vs tháng trước ({formatMoney(prevAmount ?? 0)})
          </span>
        </div>
      )}
    </div>
  );
}
