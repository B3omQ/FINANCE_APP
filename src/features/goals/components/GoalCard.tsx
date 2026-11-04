import React from "react";
import type { Account, Goal } from "@/domain/types";
import { formatMoney } from "@/shared/lib/formatMoney";
import { formatDate } from "@/shared/lib/date";
import { CategoryIcon } from "@/shared/ui/CategoryIcon";
import { Button } from "@/shared/ui/Button";
import { Calendar, CheckCircle2, Edit3, Plus, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface GoalCardProps {
  goal: Goal;
  account?: Account | null;
  onAddSaving: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

export function GoalCard({ goal, account, onAddSaving, onEdit, onDelete }: GoalCardProps) {
  const percent = goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
    : 0;
  const isCompleted = goal.savedAmount >= goal.targetAmount;
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);

  return (
    <div className="flex flex-col justify-between p-4 rounded-2xl border border-border/70 bg-card/70 hover:bg-card/95 transition-all duration-200 shadow-sm">
      <div className="space-y-3">
        {/* Header: Icon, Name, and Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <CategoryIcon
              name={goal.icon || "target"}
              color={goal.color || "#22c55e"}
              size={18}
              className="h-9 w-9 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{goal.name}</h3>
              {account && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-medium mt-0.5">
                  Ví: {account.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEdit(goal)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Sửa mục tiêu"
            >
              <Edit3 size={13} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(goal)}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors"
              title="Xóa mục tiêu"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Amounts and Progress */}
        <div className="space-y-2 pt-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Đã tích lũy:</span>
            <span className="text-sm font-bold font-tabular text-foreground">
              {formatMoney(goal.savedAmount)}{" "}
              <span className="text-xs font-normal text-muted-foreground">/ {formatMoney(goal.targetAmount)}</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isCompleted ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-semibold text-primary font-tabular">{percent}% hoàn thành</span>
            <span>
              {isCompleted ? (
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={11} /> Đã đạt mục tiêu!
                </span>
              ) : (
                `Còn thiếu: ${formatMoney(remaining)}`
              )}
            </span>
          </div>

          {goal.targetDate && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1 border-t border-border/30">
              <Calendar size={11} className="text-primary" />
              <span>Hạn mục tiêu: {formatDate(goal.targetDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Add Saving Button */}
      <div className="pt-3 mt-2 border-t border-border/40">
        <Button
          size="sm"
          variant={isCompleted ? "outline" : "default"}
          onClick={() => onAddSaving(goal)}
          className="w-full text-xs gap-1.5 h-8"
        >
          <Plus size={13} />
          <span>Thêm tiền tiết kiệm</span>
        </Button>
      </div>
    </div>
  );
}
