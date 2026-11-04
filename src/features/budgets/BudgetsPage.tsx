import React, { useState } from "react";
import { useBudgets, type CategoryBudgetInfo } from "./useBudgets";
import { BudgetCard } from "./components/BudgetCard";
import { BudgetFormDialog } from "./components/BudgetFormDialog";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/ui/Toast";
import { formatMoney } from "@/shared/lib/formatMoney";
import { formatMonthYear, shiftMonth, toMonthKey, today } from "@/shared/lib/date";
import { ChevronLeft, ChevronRight, Copy, PieChart, ShieldAlert } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function BudgetsPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthKey(today()));
  const { items, overall, isLoading, upsertBudget, copyPreviousMonth } = useBudgets(selectedMonth);
  const { showToast } = useToast();

  const [editingInfo, setEditingInfo] = useState<CategoryBudgetInfo | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  function handlePrevMonth() {
    setSelectedMonth((prev) => shiftMonth(prev, -1));
  }

  function handleNextMonth() {
    setSelectedMonth((prev) => shiftMonth(prev, 1));
  }

  function handleCurrentMonth() {
    setSelectedMonth(toMonthKey(today()));
  }

  async function handleSaveLimit(categoryId: string, limit: number) {
    await upsertBudget({ categoryId, limit });
    showToast({
      message: `Đã cập nhật hạn mức ${formatMoney(limit)} thành công!`,
      type: "success",
    });
  }

  async function handleCopy() {
    const prevMonth = shiftMonth(selectedMonth, -1);
    if (confirm(`Bạn có muốn sao chép toàn bộ hạn mức từ ${formatMonthYear(prevMonth)} sang ${formatMonthYear(selectedMonth)}?`)) {
      setIsCopying(true);
      try {
        await copyPreviousMonth();
        showToast({
          message: `Đã sao chép hạn mức từ ${formatMonthYear(prevMonth)} sang ${formatMonthYear(selectedMonth)}!`,
          type: "success",
        });
      } finally {
        setIsCopying(false);
      }
    }
  }

  const budgetedItems = items.filter((i) => i.budget && i.budget.limit > 0);
  const warningItems = items.filter((i) => i.status.level === "warn" || i.status.level === "over");

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Month Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PieChart size={22} className="text-primary" />
            Quản lý ngân sách
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Thiết lập hạn mức chi tiêu để kiểm soát tài chính theo từng tháng
          </p>
        </div>

        {/* Month picker controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border/80 bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={handleCurrentMonth}
              className="px-3 py-1 text-xs font-semibold text-foreground hover:text-primary transition-colors"
              title="Về tháng hiện tại"
            >
              {formatMonthYear(selectedMonth)}
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Tháng sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={isCopying}
            className="gap-1.5"
            title="Sao chép hạn mức từ tháng trước"
          >
            <Copy size={14} />
            <span>Sao chép</span>
          </Button>
        </div>
      </div>

      {/* Top Banner: Overall Budget Progress */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-card/50 p-6 sm:p-7 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="md:col-span-1 space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Tổng ngân sách tháng
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-tabular text-foreground">
              {formatMoney(overall.limit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Áp dụng cho {budgetedItems.length} danh mục chi
            </p>
          </div>

          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Thực tế chi: <span className="font-semibold text-foreground font-tabular">{formatMoney(overall.spent)}</span>
              </span>
              <span
                className={cn(
                  "font-bold font-tabular text-xs",
                  overall.level === "ok" && "text-emerald-500",
                  overall.level === "warn" && "text-amber-500",
                  overall.level === "over" && "text-rose-500"
                )}
              >
                {overall.percent}%
              </span>
            </div>

            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  overall.level === "ok" && "bg-emerald-500",
                  overall.level === "warn" && "bg-amber-500",
                  overall.level === "over" && "bg-rose-500"
                )}
                style={{ width: `${Math.min(100, Math.max(0, overall.percent))}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Còn lại: {formatMoney(Math.max(0, overall.remaining))}</span>
              {overall.remaining < 0 && (
                <span className="text-rose-500 font-semibold font-tabular">
                  Vượt: {formatMoney(Math.abs(overall.remaining))}
                </span>
              )}
            </div>
          </div>

          <div className="md:col-span-1 flex flex-col items-start md:items-end justify-center border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6">
            {warningItems.length > 0 ? (
              <div className="flex items-center gap-2 text-amber-500 text-xs font-medium">
                <ShieldAlert size={16} />
                <span>{warningItems.length} danh mục sắp/đã vượt</span>
              </div>
            ) : (
              <span className="text-xs text-emerald-500 font-medium">
                Ngân sách đang trong tầm kiểm soát
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">
          Chi tiết danh mục ({items.length})
        </h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Đang tải ngân sách...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border p-6">
            <p className="text-sm text-muted-foreground">Chưa có danh mục chi tiêu nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <BudgetCard key={item.category.id} info={item} onEdit={setEditingInfo} />
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <BudgetFormDialog
        isOpen={!!editingInfo}
        onClose={() => setEditingInfo(null)}
        info={editingInfo}
        selectedMonth={selectedMonth}
        onSubmit={handleSaveLimit}
      />
    </div>
  );
}

