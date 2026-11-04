import React from "react";
import type { Account, Category, RecurringRule } from "@/domain/types";
import { formatMoney } from "@/shared/lib/formatMoney";
import { formatDate, today } from "@/shared/lib/date";
import { nextOccurrence } from "@/domain/recurring";
import { CategoryIcon } from "@/shared/ui/CategoryIcon";
import { Calendar, Clock, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface RecurringCardProps {
  rule: RecurringRule;
  category?: Category | null;
  account?: Account | null;
  onToggleActive: (rule: RecurringRule) => void;
  onEdit: (rule: RecurringRule) => void;
  onDelete: (rule: RecurringRule) => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Hàng ngày",
  weekly: "Hàng tuần",
  monthly: "Hàng tháng",
  yearly: "Hàng năm",
};

export function RecurringCard({
  rule,
  category,
  account,
  onToggleActive,
  onEdit,
  onDelete,
}: RecurringCardProps) {
  const nextDate = nextOccurrence(rule, today());
  const isIncome = rule.type === "income";

  const frequencyDisplay =
    rule.interval > 1
      ? `Mỗi ${rule.interval} ${rule.frequency === "daily" ? "ngày" : rule.frequency === "weekly" ? "tuần" : rule.frequency === "monthly" ? "tháng" : "năm"}`
      : FREQUENCY_LABELS[rule.frequency] ?? rule.frequency;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 shadow-sm",
        rule.active
          ? "border-border/70 bg-card/70 hover:bg-card/95 hover:border-primary/40"
          : "border-border/30 bg-muted/20 opacity-75"
      )}
    >
      <div className="space-y-3">
        {/* Header: Category / Icon + Rule Name + Active toggle */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <CategoryIcon
              name={category?.icon ?? "repeat"}
              color={category?.color ?? "#64748b"}
              size={18}
              className="h-9 w-9 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{rule.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium">
                  {frequencyDisplay}
                </span>
                {account && <span className="truncate">{account.name}</span>}
              </div>
            </div>
          </div>

          {/* Active status switch button */}
          <button
            type="button"
            onClick={() => onToggleActive(rule)}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              rule.active ? "bg-primary" : "bg-muted"
            )}
            title={rule.active ? "Đang bật (Bấm để tắt)" : "Đang tắt (Bấm để bật)"}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                rule.active ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Amount */}
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-xs text-muted-foreground">Số tiền:</span>
          <span
            className={cn(
              "text-base font-bold font-tabular tracking-tight",
              isIncome ? "text-emerald-500" : "text-rose-500"
            )}
          >
            {isIncome ? "+" : "-"}
            {formatMoney(rule.amount)}
          </span>
        </div>

        {/* Next Occurrence Info */}
        <div className="rounded-xl bg-muted/40 p-2.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock size={12} className="text-primary" />
              Lần sinh tiếp theo:
            </span>
            <span className="font-medium text-foreground">
              {rule.active
                ? nextDate
                  ? formatDate(nextDate)
                  : "Đã hoàn thành"
                : "Đã tạm dừng"}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              Bắt đầu:
            </span>
            <span>{formatDate(rule.startDate)}</span>
          </div>

          {rule.endDate && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Kết thúc:</span>
              <span>{formatDate(rule.endDate)}</span>
            </div>
          )}

          {rule.lastGeneratedDate && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/30 pt-1 mt-1">
              <span>Đã sinh gần nhất:</span>
              <span>{formatDate(rule.lastGeneratedDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5 pt-3 mt-2 border-t border-border/40">
        <button
          type="button"
          onClick={() => onEdit(rule)}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs flex items-center gap-1"
          title="Sửa quy tắc"
        >
          <Edit3 size={13} />
          <span>Sửa</span>
        </button>
        <button
          type="button"
          onClick={() => onDelete(rule)}
          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors text-xs flex items-center gap-1"
          title="Xóa quy tắc"
        >
          <Trash2 size={13} />
          <span>Xóa</span>
        </button>
      </div>
    </div>
  );
}

