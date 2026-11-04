import React, { useMemo, useState } from "react";
import { useGoals } from "./useGoals";
import { GoalCard } from "./components/GoalCard";
import { GoalFormDialog } from "./components/GoalFormDialog";
import { AddSavingDialog } from "./components/AddSavingDialog";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/ui/Toast";
import { useRepositories } from "@/app/providers";
import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@/shared/lib/formatMoney";
import type { Account, Goal, NewGoal } from "@/domain/types";
import { Plus, Target, Trophy } from "lucide-react";

export function GoalsPage() {
  const { goals, isLoading, createGoal, updateGoal, deleteGoal, addSaving } = useGoals();
  const { showToast } = useToast();
  const repos = useRepositories();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [savingGoal, setSavingGoal] = useState<Goal | null>(null);

  // Load accounts for linking
  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: () => repos.accounts.list(),
  });
  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const accountsMap = useMemo(() => {
    const map = new Map<string, Account>();
    for (const a of accounts) map.set(a.id, a);
    return map;
  }, [accounts]);

  // Overall totals
  const overall = useMemo(() => {
    let totalTarget = 0;
    let totalSaved = 0;
    let completedCount = 0;

    for (const g of goals) {
      totalTarget += g.targetAmount;
      totalSaved += g.savedAmount;
      if (g.savedAmount >= g.targetAmount) {
        completedCount++;
      }
    }

    const percent = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
    return { totalTarget, totalSaved, percent, completedCount };
  }, [goals]);

  async function handleSaveGoal(data: NewGoal) {
    if (editingGoal) {
      await updateGoal({ id: editingGoal.id, patch: data });
      showToast({ message: "Đã cập nhật mục tiêu thành công!", type: "success" });
    } else {
      await createGoal(data);
      showToast({ message: "Đã tạo mục tiêu tiết kiệm mới!", type: "success" });
    }
  }

  async function handleAddSaving(id: string, amount: number) {
    await addSaving({ id, amount });
    showToast({
      message: `Đã thêm ${formatMoney(amount)} vào mục tiêu!`,
      type: "success",
    });
  }

  async function handleDelete(goal: Goal) {
    if (confirm(`Bạn có chắc muốn xóa mục tiêu "${goal.name}"?`)) {
      await deleteGoal(goal.id);
      showToast({ message: `Đã xóa mục tiêu "${goal.name}"`, type: "info" });
    }
  }

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target size={22} className="text-primary" />
            Mục tiêu tiết kiệm
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lập kế hoạch mua sắm, tích lũy quỹ khẩn cấp và theo dõi tiến độ hoàn thành
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setEditingGoal(null);
            setIsFormOpen(true);
          }}
          className="gap-1.5 font-medium"
        >
          <Plus size={16} />
          Mục tiêu mới
        </Button>
      </div>

      {/* Top Banner: Progress Overview */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-card/50 p-6 sm:p-7 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Tổng tiền đã tiết kiệm
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-tabular text-foreground">
              {formatMoney(overall.totalSaved)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mục tiêu tổng: <span className="font-semibold text-foreground font-tabular">{formatMoney(overall.totalTarget)}</span>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tiến độ chung:</span>
              <span className="font-bold text-primary font-tabular">{overall.percent}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${overall.percent}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground block">
              {overall.completedCount} / {goals.length} mục tiêu đã hoàn thành
            </span>
          </div>

          <div className="flex flex-col items-start md:items-end justify-center border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-500">
              <Trophy size={18} />
              <span>
                {overall.completedCount > 0
                  ? `Xuất sắc! Đã hoàn thành ${overall.completedCount} mục tiêu`
                  : "Bắt đầu tích lũy từng bước nhỏ mỗi ngày"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">
          Danh sách mục tiêu ({goals.length})
        </h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Đang tải mục tiêu...</p>
        ) : goals.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border p-6">
            <p className="text-sm text-muted-foreground mb-3">Bạn chưa có mục tiêu tiết kiệm nào.</p>
            <Button
              size="sm"
              onClick={() => {
                setEditingGoal(null);
                setIsFormOpen(true);
              }}
            >
              Tạo mục tiêu đầu tiên
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                account={g.accountId ? accountsMap.get(g.accountId) : null}
                onAddSaving={(targetGoal) => setSavingGoal(targetGoal)}
                onEdit={(targetGoal) => {
                  setEditingGoal(targetGoal);
                  setIsFormOpen(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <GoalFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingGoal(null);
        }}
        goal={editingGoal}
        accounts={accounts}
        onSubmit={handleSaveGoal}
      />

      {/* Add Saving Modal */}
      <AddSavingDialog
        isOpen={!!savingGoal}
        onClose={() => setSavingGoal(null)}
        goal={savingGoal}
        onSubmit={handleAddSaving}
      />
    </div>
  );
}

