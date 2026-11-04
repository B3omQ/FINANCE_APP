import React from "react";
import type { CategoryBudgetInfo } from "../useBudgets";
import { formatMoney } from "@/shared/lib/formatMoney";
import { CategoryIcon } from "@/shared/ui/CategoryIcon";
import { AlertCircle, CheckCircle2, Edit3, Plus, TrendingUp } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface BudgetCardProps {
  info: CategoryBudgetInfo;
  onEdit: (info: CategoryBudgetInfo) => void;
}

export function BudgetCard({ info, onEdit }: BudgetCardProps) {
  const { category, budget, status } = info;
  const hasBudget = !!budget && budget.limit > 0;
  const clampedPercent = Math.min(100, Math.max(0, status.percent));

  return (
    <div className="flex flex-col justify-between p-4 rounded-2xl border border-border/70 bg-card/70 hover:bg-card/95 transition-all duration-200 shadow-sm">
      <div className="space-y-3">
        {/* Header: Icon, Name, and Edit button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <CategoryIcon
              name={category.icon}
              color={category.color}
              size={18}
              className="h-9 w-9 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{category.name}</h3>
              <p className="text-xs text-muted-foreground">
                Đã chi: <span className="font-semibold text-foreground font-tabular">{formatMoney(status.spent)}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onEdit(info)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={hasBudget ? "Sửa hạn mức" : "Thiết lập hạn mức"}
          >
            {hasBudget ? <Edit3 size={14} /> : <Plus size={14} />}
          </button>
        </div>

        {/* Limit and Progress status */}
        {hasBudget ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Hạn mức: <span className="font-semibold text-foreground font-tabular">{formatMoney(status.limit)}</span>
              </span>
              <span
                className={cn(
                  "font-bold font-tabular flex items-center gap-1",
                  status.level === "ok" && "text-emerald-500",
                  status.level === "warn" && "text-amber-500",
                  status.level === "over" && "text-rose-500"
                )}
              >
                {status.level === "ok" && <CheckCircle2 size={12} />}
                {status.level === "warn" && <AlertCircle size={12} />}
                {status.level === "over" && <TrendingUp size={12} />}
                {status.percent}%
              </span>
            </div>

            {/* Progress Bar with level colors */}
            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  status.level === "ok" && "bg-emerald-500",
                  status.level === "warn" && "bg-amber-500",
                  status.level === "over" && "bg-rose-500"
                )}
                style={{ width: `${clampedPercent}%` }}
              />
            </div>

            {/* Remaining amount */}
            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-muted-foreground">
                {status.remaining >= 0 ? "Còn lại được chi:" : "Vượt ngân sách:"}
              </span>
              <span
                className={cn(
                  "font-semibold font-tabular",
                  status.remaining >= 0 ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {formatMoney(Math.abs(status.remaining))}
              </span>
            </div>
          </div>
        ) : (
          <div className="pt-2 text-center py-2 rounded-xl bg-muted/30 border border-dashed border-border/60">
            <p className="text-xs text-muted-foreground mb-1.5">Chưa đặt hạn mức</p>
            <button
              type="button"
              onClick={() => onEdit(info)}
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              <Plus size={12} />
              Đặt hạn mức
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

