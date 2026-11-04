import React, { useEffect, useState } from "react";
import type { Account, Category, NewTransaction, Transaction } from "@/domain/types";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { parseAmount } from "@/shared/lib/parseAmount";
import { formatMoney } from "@/shared/lib/formatMoney";

export interface TransactionEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onSubmit: (id: string, patch: Partial<NewTransaction>) => Promise<void>;
}

export function TransactionEditDialog({
  isOpen,
  onClose,
  transaction,
  accounts,
  categories,
  onSubmit,
}: TransactionEditDialogProps) {
  const [date, setDate] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setDate(transaction.date);
      setAmountInput(Math.abs(transaction.amount).toString());
      setAccountId(transaction.accountId);
      setCategoryId(transaction.categoryId);
      setNote(transaction.note);
      setError("");
    }
  }, [transaction, isOpen]);

  if (!transaction) return null;

  const parsedAmount = parseAmount(amountInput);
  const isTransfer = transaction.type === "transfer";
  const relevantCategories = categories.filter((c) => c.kind === transaction.type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    if (!accountId) {
      setError("Vui lòng chọn ví.");
      return;
    }

    // Signed amount in DB: expense is negative, incoming transfer/income is positive, outgoing transfer is negative
    const sign =
      transaction?.type === "expense" ||
      (transaction?.type === "transfer" && (transaction?.amount ?? 0) < 0)
        ? -1
        : 1;
    const finalAmount = sign * parsedAmount;

    setIsSubmitting(true);
    try {
      await onSubmit(transaction!.id, {
        date,
        amount: finalAmount,
        accountId,
        categoryId: isTransfer ? null : categoryId,
        note: note.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu giao dịch.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa giao dịch"
      description={`Chỉnh sửa chi tiết ${isTransfer ? "chuyển khoản" : "giao dịch"}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground">
              Số tiền <span className="text-rose-500">*</span>
            </label>
            {parsedAmount !== null && (
              <span className="text-xs font-semibold text-primary font-tabular">
                = {formatMoney(parsedAmount)}
              </span>
            )}
          </div>
          <Input
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="Ví dụ: 50k, 1.2tr..."
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Ngày</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Ví</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background/50 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!isTransfer && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Danh mục</label>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="w-full h-9 rounded-md border border-input bg-background/50 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Không phân loại</option>
              {relevantCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Ghi chú</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú giao dịch..."
          />
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm -mx-5 -mb-4 px-5 py-3.5 border-t border-border/40 flex items-center justify-end gap-2.5 mt-4 z-10 shadow-lg">
          <Button type="button" variant="outline" className="min-h-[40px] px-4" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" className="min-h-[40px] px-5 font-bold" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
