import React, { useMemo, useState } from "react";
import { useTransactions } from "./useTransactions";
import { TransactionGroup } from "./components/TransactionGroup";
import { TransactionFilterBar } from "./components/TransactionFilterBar";
import { TransactionEditDialog } from "./components/TransactionEditDialog";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/ui/Toast";
import { useRepositories } from "@/app/providers";
import { useQuery } from "@tanstack/react-query";
import type { Account, Category, DateOnly, NewTransaction, Transaction } from "@/domain/types";
import type { TransactionFilter } from "@/data/repositories/types";
import { ArrowUpDown, Plus } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

export function TransactionsPage() {
  const [filter, setFilter] = useState<TransactionFilter>({});
  const { transactions, isLoading, updateTransaction, deleteTransaction, restoreTransaction } =
    useTransactions(filter);

  const repos = useRepositories();
  const { openQuickAdd } = useUIStore();
  const { showToast } = useToast();

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Load accounts and categories for mapping & filters
  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: () => repos.accounts.list({ includeArchived: true }),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => repos.categories.list(),
  });

  const rawAccounts = accountsQuery.data;
  const accounts = useMemo(() => rawAccounts ?? [], [rawAccounts]);

  const rawCategories = categoriesQuery.data;
  const categories = useMemo(() => rawCategories ?? [], [rawCategories]);

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

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = new Map<DateOnly, Transaction[]>();
    for (const tx of transactions) {
      const list = groups.get(tx.date) ?? [];
      list.push(tx);
      groups.set(tx.date, list);
    }
    return Array.from(groups.entries());
  }, [transactions]);

  async function handleDelete(tx: Transaction) {
    await deleteTransaction(tx.id);
    showToast({
      message: "Đã xóa giao dịch",
      action: {
        label: "Hoàn tác",
        onClick: async () => {
          await restoreTransaction(tx.id);
          showToast({ message: "Đã hoàn tác giao dịch", type: "success" });
        },
      },
    });
  }

  async function handleUpdate(id: string, patch: Partial<NewTransaction>) {
    await updateTransaction({ id, patch });
    showToast({ message: "Đã cập nhật giao dịch thành công", type: "success" });
  }

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ArrowUpDown size={22} className="text-primary" />
            Lịch sử giao dịch
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Xem và quản lý toàn bộ các khoản thu, chi và chuyển khoản
          </p>
        </div>

        <Button size="sm" onClick={openQuickAdd} className="gap-1.5 font-medium">
          <Plus size={16} />
          Giao dịch mới (N)
        </Button>
      </div>

      {/* Filter Bar */}
      <TransactionFilterBar
        filter={filter}
        onChange={setFilter}
        accounts={accounts}
        categories={categories}
      />

      {/* Transactions List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground py-10 text-center">Đang tải giao dịch...</p>
      ) : groupedTransactions.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border p-6">
          <p className="text-sm text-muted-foreground mb-3">
            {Object.keys(filter).length > 0
              ? "Không tìm thấy giao dịch nào phù hợp với bộ lọc."
              : "Chưa có giao dịch nào được ghi nhận."}
          </p>
          <Button size="sm" onClick={openQuickAdd}>
            Thêm giao dịch đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map(([date, txs]) => (
            <TransactionGroup
              key={date}
              date={date}
              transactions={txs}
              categoriesMap={categoriesMap}
              accountsMap={accountsMap}
              onEdit={setEditingTx}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <TransactionEditDialog
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
        accounts={accounts}
        categories={categories}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
