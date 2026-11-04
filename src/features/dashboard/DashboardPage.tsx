import React, { useState } from "react";
import { useDashboard } from "./useDashboard";
import { StatCard } from "./components/StatCard";
import { CategoryPieChart } from "./components/CategoryPieChart";
import { MonthlyBarChart } from "./components/MonthlyBarChart";
import { formatMoney } from "@/shared/lib/formatMoney";
import { formatMonthYear, shiftMonth, toMonthKey, today } from "@/shared/lib/date";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Plus,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { CategoryIcon } from "@/shared/ui/CategoryIcon";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/shared/lib/cn";
import { 
  BankNotificationBanner, 
  BankNotificationTestWidget, 
  BankNotificationDiagnosticsModal 
} from "@/features/bank-sync/components/BankNotificationBanner";

export function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthKey(today()));
  const [isBankLogOpen, setIsBankLogOpen] = useState(false);
  const {
    currentSummary,
    prevSummary,
    comparison,
    categoryExpenses,
    monthlyTrendData,
    recentTxs,
    warningBudgets,
    categoriesMap,
    accountsMap,
    isLoading,
  } = useDashboard(selectedMonth);

  const { openQuickAdd } = useUIStore();

  function handlePrevMonth() {
    setSelectedMonth((prev) => shiftMonth(prev, -1));
  }

  function handleNextMonth() {
    setSelectedMonth((prev) => shiftMonth(prev, 1));
  }

  function handleCurrentMonth() {
    setSelectedMonth(toMonthKey(today()));
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Đang tải dữ liệu tổng quan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-5 sm:p-7 max-w-6xl mx-auto w-full space-y-6">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Tổng quan tài chính
            </h1>
            <span className="fin-badge bg-primary/10 text-primary border border-primary/20">
              <Sparkles size={11} />
              <span>Thời gian thực</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-1 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Dòng tiền cá nhân, phân bổ chi tiêu và kiểm soát hạn mức
            </p>
            <button
              type="button"
              onClick={() => setIsBankLogOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors py-0.5 px-2 rounded-md border border-border/50 hover:border-primary/40 bg-card/60 shadow-sm"
              title="Xem nhật ký thông báo ngân hàng MB, Techcombank, VCB..."
            >
              <Activity size={12} className="text-primary" />
              <span>Log thông báo ngân hàng</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Month picker controls */}
          <div className="flex items-center rounded-xl border border-border/80 bg-card/80 backdrop-blur p-1 shadow-sm">
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
              className="px-3 py-1 text-xs font-bold text-foreground hover:text-primary transition-colors font-mono"
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

          <Button size="sm" onClick={openQuickAdd} className="font-bold shadow-sm">
            <Plus size={15} className="stroke-[2.5]" />
            <span>Thêm (N)</span>
          </Button>
        </div>
      </div>

      {/* Detected Bank Notifications Banner */}
      <BankNotificationBanner />

      {/* 3 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Tổng thu nhập"
          amount={currentSummary.income}
          icon={TrendingUp}
          variant="income"
          diffPercent={comparison.incomeDiffPercent}
          prevAmount={prevSummary.income}
        />
        <StatCard
          title="Tổng chi tiêu"
          amount={currentSummary.expense}
          icon={TrendingDown}
          variant="expense"
          diffPercent={comparison.expenseDiffPercent}
          prevAmount={prevSummary.expense}
        />
        <StatCard
          title="Dư tích lũy (Thu - Chi)"
          amount={currentSummary.net}
          icon={Scale}
          variant="net"
          diffPercent={
            prevSummary.net !== 0
              ? Math.round((comparison.netDiff / Math.abs(prevSummary.net)) * 100)
              : undefined
          }
          prevAmount={prevSummary.net}
        />
      </div>

      {/* Charts Grid: Pie Chart (Category Breakdown) & Bar Chart (6-Month Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart Card */}
        <div className="fin-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <PieChart size={15} />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Tỷ trọng chi tiêu
              </h2>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              {formatMonthYear(selectedMonth)}
            </span>
          </div>
          <CategoryPieChart
            data={categoryExpenses}
            totalExpense={currentSummary.expense}
          />
        </div>

        {/* Bar Chart Card */}
        <div className="fin-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <TrendingUp size={15} />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Xu hướng thu / chi 6 tháng
              </h2>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">Dòng tiền gần đây</span>
          </div>
          <MonthlyBarChart data={monthlyTrendData} />
        </div>
      </div>

      {/* Bottom Grid: 5 Recent Transactions & Warning Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5 Recent Transactions */}
        <div className="fin-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Giao dịch gần đây
            </h2>
            <Link
              to="/transactions"
              className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1 group"
            >
              <span>Xem tất cả</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {recentTxs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-10 text-center">Chưa có giao dịch nào.</p>
          ) : (
            <div className="divide-y divide-border/30">
              {recentTxs.map((tx) => {
                const cat = tx.categoryId ? categoriesMap.get(tx.categoryId) : null;
                const acc = accountsMap.get(tx.accountId);
                const isIncome = tx.type === "income";
                const isTransfer = tx.type === "transfer";

                return (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between text-xs hover:bg-muted/30 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIcon
                        name={cat?.icon ?? (isTransfer ? "arrow-right-left" : "tag")}
                        color={cat?.color ?? (isTransfer ? "#3b82f6" : "#64748b")}
                        size={16}
                        className="h-9 w-9 shrink-0 shadow-sm"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate text-[13px]">
                          {tx.note || cat?.name || (isTransfer ? "Chuyển tiền" : "Giao dịch")}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 font-medium">
                          <span className="text-foreground/80">{acc?.name}</span>
                          <span>•</span>
                          <span className="font-mono">{tx.date}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "font-extrabold font-tabular text-right shrink-0 ml-3 text-[13px]",
                        isIncome && "text-emerald-400",
                        tx.type === "expense" && "text-rose-400",
                        isTransfer && "text-blue-400"
                      )}
                    >
                      {formatMoney(tx.amount, { showSign: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Warning Budgets */}
        <div className="fin-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-amber-400" />
              <span>Ngân sách cần lưu ý</span>
            </h2>
            <Link
              to="/budgets"
              className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1 group"
            >
              <span>Quản lý hạn mức</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {warningBudgets.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground space-y-1">
              <p className="text-primary font-semibold text-sm">Hạn mức chi tiêu an toàn</p>
              <p className="text-[11px]">Chưa có danh mục nào chạm ngưỡng cảnh báo 80%.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {warningBudgets.map(({ budget, category, status }) => {
                const percent = status.percent;
                const isOver = status.level === "over";

                return (
                  <div key={budget.id} className="p-3.5 rounded-xl border border-border/50 bg-card/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CategoryIcon
                          name={category?.icon ?? "tag"}
                          color={category?.color ?? "#64748b"}
                          size={15}
                          className="h-7 w-7 shrink-0"
                        />
                        <span className="font-semibold text-foreground text-sm">
                          {category?.name ?? "Danh mục"}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "fin-badge",
                          isOver
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                        )}
                      >
                        {percent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          isOver ? "bg-rose-500" : "bg-amber-500"
                        )}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-tabular font-medium">
                      <span>Đã chi: {formatMoney(status.spent)}</span>
                      <span>Hạn mức: {formatMoney(budget.limit)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dev / Test helper widget */}
      <BankNotificationTestWidget />

      {/* Diagnostics & Logs Modal */}
      <BankNotificationDiagnosticsModal
        isOpen={isBankLogOpen}
        onClose={() => setIsBankLogOpen(false)}
      />
    </div>
  );
}
