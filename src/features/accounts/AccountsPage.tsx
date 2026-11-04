import React, { useState } from "react";
import { useAccounts } from "./useAccounts";
import { AccountCard } from "./components/AccountCard";
import { AccountFormDialog } from "./components/AccountFormDialog";
import { TransferDialog } from "./components/TransferDialog";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/ui/Toast";
import { formatMoney } from "@/shared/lib/formatMoney";
import { calculateTotalNetWorth } from "@/domain/balance";
import type { Account, NewAccount, NewTransfer } from "@/domain/types";
import { ArrowRightLeft, Plus, Wallet } from "lucide-react";

export function AccountsPage() {
  const {
    accounts,
    balances,
    isLoading,
    createAccount,
    updateAccount,
    deleteAccount,
    transferFunds,
  } = useAccounts({ includeArchived: true });

  const { showToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const activeAccounts = accounts.filter((a) => !a.archived);
  const archivedAccounts = accounts.filter((a) => a.archived);

  const totalNetWorth = calculateTotalNetWorth(accounts, balances);

  async function handleSaveAccount(data: NewAccount) {
    if (editingAccount) {
      await updateAccount({ id: editingAccount.id, patch: data });
      showToast({ message: "Đã cập nhật thông tin ví thành công", type: "success" });
    } else {
      await createAccount(data);
      showToast({ message: "Đã tạo ví mới thành công", type: "success" });
    }
  }

  async function handleToggleArchive(acc: Account) {
    const nextStatus = !acc.archived;
    await updateAccount({ id: acc.id, patch: { archived: nextStatus } });
    showToast({
      message: nextStatus ? `Đã lưu trữ ví "${acc.name}"` : `Đã kích hoạt lại ví "${acc.name}"`,
      type: "info",
    });
  }

  async function handleDelete(acc: Account) {
    if (confirm(`Bạn có chắc chắn muốn xóa ví "${acc.name}"? Dữ liệu ví sẽ được đưa vào thùng rác.`)) {
      await deleteAccount(acc.id);
      showToast({ message: `Đã xóa ví "${acc.name}"`, type: "info" });
    }
  }

  async function handleTransfer(data: NewTransfer) {
    await transferFunds(data);
    showToast({
      message: `Đã chuyển ${formatMoney(data.amount)} thành công!`,
      type: "success",
    });
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Đang tải danh sách ví...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Top Banner: Net Worth */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-card/50 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Wallet size={14} className="text-primary" />
              Tổng tài sản hiện có
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-tabular tracking-tight text-foreground">
              {formatMoney(totalNetWorth)}
            </h1>
            <p className="text-xs text-muted-foreground">
              Tổng số dư từ {activeAccounts.length} ví hoạt động
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTransferOpen(true)}
              disabled={activeAccounts.length < 2}
              className="flex-1 sm:flex-initial gap-1.5"
            >
              <ArrowRightLeft size={15} />
              Chuyển tiền
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingAccount(null);
                setIsFormOpen(true);
              }}
              className="flex-1 sm:flex-initial gap-1.5"
            >
              <Plus size={16} />
              Thêm ví mới
            </Button>
          </div>
        </div>
      </div>

      {/* Active Accounts Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Ví hoạt động</h2>
        {activeAccounts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border p-6">
            <p className="text-sm text-muted-foreground mb-3">Bạn chưa có ví nào đang hoạt động.</p>
            <Button
              size="sm"
              onClick={() => {
                setEditingAccount(null);
                setIsFormOpen(true);
              }}
            >
              Tạo ví đầu tiên
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAccounts.map((acc) => (
              <AccountCard
                key={acc.id}
                account={acc}
                balance={balances[acc.id] ?? acc.initialBalance}
                onEdit={(a) => {
                  setEditingAccount(a);
                  setIsFormOpen(true);
                }}
                onArchive={handleToggleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Archived Accounts */}
      {archivedAccounts.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border/40">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Ví đã lưu trữ ({archivedAccounts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedAccounts.map((acc) => (
              <AccountCard
                key={acc.id}
                account={acc}
                balance={balances[acc.id] ?? acc.initialBalance}
                onEdit={(a) => {
                  setEditingAccount(a);
                  setIsFormOpen(true);
                }}
                onArchive={handleToggleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AccountFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAccount(null);
        }}
        account={editingAccount}
        onSubmit={handleSaveAccount}
      />

      <TransferDialog
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        accounts={activeAccounts}
        onTransfer={handleTransfer}
      />
    </div>
  );
}
