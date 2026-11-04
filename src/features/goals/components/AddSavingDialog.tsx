import React, { useState } from "react";
import type { Goal } from "@/domain/types";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { parseAmount } from "@/shared/lib/parseAmount";
import { formatMoney } from "@/shared/lib/formatMoney";
import { Plus } from "lucide-react";

export interface AddSavingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onSubmit: (id: string, amount: number) => Promise<void>;
}

export function AddSavingDialog({
  isOpen,
  onClose,
  goal,
  onSubmit,
}: AddSavingDialogProps) {
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!goal) return null;

  const parsedAmount = parseAmount(amountInput);
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ (> 0).");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(goal!.id, parsedAmount);
      setAmountInput("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi thêm tiền.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm tiền tiết kiệm"
      description={`Tích lũy thêm cho mục tiêu "${goal.name}"`}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground">
              Số tiền muốn thêm <span className="text-rose-500">*</span>
            </label>
            {parsedAmount !== null && (
              <span className="text-xs font-semibold text-primary font-tabular">
                = {formatMoney(parsedAmount)}
              </span>
            )}
          </div>
          <Input
            placeholder="Ví dụ: 500k, 1tr, 200000..."
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            autoFocus
          />
        </div>

        {/* Goal Status summary */}
        <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Hiện tại đã có:</span>
            <span className="font-semibold text-foreground font-tabular">{formatMoney(goal.savedAmount)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Mục tiêu cần đạt:</span>
            <span className="font-semibold text-foreground font-tabular">{formatMoney(goal.targetAmount)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground border-t border-border/40 pt-1 mt-1">
            <span>Còn thiếu:</span>
            <span className="font-semibold text-primary font-tabular">{formatMoney(remaining)}</span>
          </div>
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm -mx-5 -mb-4 px-5 py-3.5 border-t border-border/40 flex items-center justify-end gap-2.5 mt-4 z-10 shadow-lg">
          <Button type="button" variant="outline" className="min-h-[40px] px-4" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-h-[40px] px-5 font-bold gap-1.5">
            <Plus size={14} />
            {isSubmitting ? "Đang lưu..." : "Xác nhận thêm"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

