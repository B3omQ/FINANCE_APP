import React, { useMemo, useState } from "react";
import { useRecurring } from "./useRecurring";
import { useRecurringAutoProcess } from "./useRecurringAutoProcess";
import { RecurringCard } from "./components/RecurringCard";
import { RecurringFormDialog } from "./components/RecurringFormDialog";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/ui/Toast";
import { useRepositories } from "@/app/providers";
import { useQuery } from "@tanstack/react-query";
import type { Account, Category, NewRecurringRule, RecurringRule } from "@/domain/types";
import { Play, Plus, RefreshCw, Repeat } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function RecurringPage() {
  const [filterTab, setFilterTab] = useState<"all" | "active" | "inactive">("all");
  const { rules, isLoading, createRule, updateRule, deleteRule, toggleActive } = useRecurring();
  const { isProcessing, runProcess } = useRecurringAutoProcess();
  const { showToast } = useToast();
  const repos = useRepositories();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);

  // Load accounts and categories
  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: () => repos.accounts.list(),
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => repos.categories.list(),
  });

  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const accountsMap = useMemo(() => {
    const map = new Map<string, Account>();
    for (const a of accounts) map.set(a.id, a);
    return map;
  }, [accounts]);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const filteredRules = useMemo(() => {
    if (filterTab === "active") return rules.filter((r) => r.active);
    if (filterTab === "inactive") return rules.filter((r) => !r.active);
    return rules;
  }, [rules, filterTab]);

  async function handleSave(data: NewRecurringRule) {
    if (editingRule) {
      await updateRule({ id: editingRule.id, patch: data });
      showToast({ message: "Đã cập nhật quy tắc định kỳ!", type: "success" });
    } else {
      await createRule(data);
      showToast({ message: "Đã tạo quy tắc định kỳ mới!", type: "success" });
      // Trigger auto-process to catch if today is due
      runProcess();
    }
  }

  async function handleToggle(rule: RecurringRule) {
    await toggleActive(rule);
    showToast({
      message: rule.active ? `Đã tạm dừng "${rule.name}"` : `Đã kích hoạt "${rule.name}"`,
      type: "info",
    });
  }

  async function handleDelete(rule: RecurringRule) {
    if (confirm(`Bạn có chắc muốn xóa quy tắc định kỳ "${rule.name}"?`)) {
      await deleteRule(rule.id);
      showToast({ message: `Đã xóa quy tắc "${rule.name}"`, type: "info" });
    }
  }

  async function handleManualTrigger() {
    const res = await runProcess();
    if (res.generatedCount > 0) {
      showToast({
        message: `Đã sinh thành công ${res.generatedCount} giao dịch đến hạn!`,
        type: "success",
      });
    } else {
      showToast({
        message: "Không có giao dịch định kỳ nào đến hạn hôm nay.",
        type: "info",
      });
    }
  }

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Repeat size={22} className="text-primary" />
            Giao dịch định kỳ
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tự động sinh các khoản thu chi cố định (tiền nhà, tiền mạng, lương...) mỗi khi mở app
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualTrigger}
            disabled={isProcessing}
            className="flex-1 sm:flex-initial gap-1.5"
            title="Kiểm tra và sinh các giao dịch đến hạn hôm nay"
          >
            {isProcessing ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            <span>{isProcessing ? "Đang xử lý..." : "Sinh giao dịch"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingRule(null);
              setIsDialogOpen(true);
            }}
            className="flex-1 sm:flex-initial gap-1.5 font-medium"
          >
            <Plus size={16} />
            Thêm quy tắc
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60">
        <button
          type="button"
          onClick={() => setFilterTab("all")}
          className={cn(
            "pb-3 px-4 text-xs font-semibold border-b-2 transition-all",
            filterTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Tất cả ({rules.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("active")}
          className={cn(
            "pb-3 px-4 text-xs font-semibold border-b-2 transition-all",
            filterTab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Đang hoạt động ({rules.filter((r) => r.active).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("inactive")}
          className={cn(
            "pb-3 px-4 text-xs font-semibold border-b-2 transition-all",
            filterTab === "inactive"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Đã tạm dừng ({rules.filter((r) => !r.active).length})
        </button>
      </div>

      {/* Rule List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground py-10 text-center">Đang tải quy tắc định kỳ...</p>
      ) : filteredRules.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border p-6">
          <p className="text-sm text-muted-foreground mb-3">
            {rules.length === 0
              ? "Bạn chưa thiết lập giao dịch định kỳ nào."
              : "Không tìm thấy quy tắc nào trong nhóm này."}
          </p>
          <Button
            size="sm"
            onClick={() => {
              setEditingRule(null);
              setIsDialogOpen(true);
            }}
          >
            Tạo quy tắc đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map((rule) => (
            <RecurringCard
              key={rule.id}
              rule={rule}
              category={categoriesMap.get(rule.categoryId)}
              account={accountsMap.get(rule.accountId)}
              onToggleActive={handleToggle}
              onEdit={(r) => {
                setEditingRule(r);
                setIsDialogOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <RecurringFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingRule(null);
        }}
        rule={editingRule}
        accounts={accounts}
        categories={categories}
        onSubmit={handleSave}
      />
    </div>
  );
}

