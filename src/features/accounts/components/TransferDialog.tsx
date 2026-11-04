import React, { useState } from "react";
import type { Account, NewTransfer } from "@/domain/types";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { parseAmount } from "@/shared/lib/parseAmount";
import { formatMoney } from "@/shared/lib/formatMoney";
import { today } from "@/shared/lib/date";
import { ArrowRightLeft } from "lucide-react";

export interface TransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onTransfer: (data: NewTransfer) => Promise<void>;
}

export function TransferDialog({
  isOpen,
  onClose,
  accounts,
  onTransfer,
}: TransferDialogProps) {
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id ?? "");
  const [amountInput, setAmountInput] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedAmount = parseAmount(amountInput);

  function handleSwapAccounts() {
    setFromAccountId(toAccountId);
    setToAccountId(fromAccountId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fromAccountId || !toAccountId) {
      setError("Vui lòng chọn cả ví nguồn và ví đích.");
      return;
    }

    if (fromAccountId === toAccountId) {
      setError("Ví nguồn và ví đích không được trùng nhau.");
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Vui lòng nhập số tiền chuyển hợp lệ (lớn hơn 0).");
      return;
    }

    setIsSubmitting(true);
    try {
      await onTransfer({
        fromAccountId,
        toAccountId,
        amount: parsedAmount,
        date,
        note: note.trim() || "Chuyển tiền giữa các ví",
      });
      setAmountInput("");
      setNote("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi chuyển tiền.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chuyển tiền giữa ví"
      description="Chuyển tiền qua lại giữa các ví (không tính vào thu/chi báo cáo)."
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Ví chuyển đi (Từ ví)
            </label>
            <select
              value={fromAccountId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === toAccountId) {
                  setToAccountId(fromAccountId);
                }
                setFromAccountId(val);
              }}
              className="w-full h-9 rounded-md border border-input bg-background/50 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwapAccounts}
            className="sm:mt-5 p-2 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Đổi chiều chuyển tiền"
          >
            <ArrowRightLeft size={16} />
          </button>

          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Ví nhận tiền (Đến ví)
            </label>
            <select
              value={toAccountId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === fromAccountId) {
                  setFromAccountId(toAccountId);
                }
                setToAccountId(val);
              }}
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground">
              Số tiền chuyển <span className="text-rose-500">*</span>
            </label>
            {parsedAmount !== null && (
              <span className="text-xs font-semibold text-primary font-tabular">
                = {formatMoney(parsedAmount)}
              </span>
            )}
          </div>
          <Input
            placeholder="Ví dụ: 500k, 1tr, 200.000"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Ngày chuyển
          </label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Ghi chú (Tùy chọn)
          </label>
          <Input
            placeholder="Ví dụ: Rút tiền ATM, nạp tiền ví MoMo..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm -mx-5 -mb-4 px-5 py-3.5 border-t border-border/40 flex items-center justify-end gap-2.5 mt-4 z-10 shadow-lg">
          <Button type="button" variant="outline" className="min-h-[40px] px-4" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-h-[40px] px-5 font-bold gap-2">
            <ArrowRightLeft size={16} />
            {isSubmitting ? "Đang chuyển..." : "Xác nhận chuyển"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
