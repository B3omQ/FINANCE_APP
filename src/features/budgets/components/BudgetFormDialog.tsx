import React, { useEffect, useState } from "react";
import type { CategoryBudgetInfo } from "../useBudgets";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { parseAmount } from "@/shared/lib/parseAmount";
import { formatMoney } from "@/shared/lib/formatMoney";
import { formatMonthYear } from "@/shared/lib/date";

export interface BudgetFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  info?: CategoryBudgetInfo | null;
  selectedMonth: string;
  onSubmit: (categoryId: string, limit: number) => Promise<void>;
}

export function BudgetFormDialog({
  isOpen,
  onClose,
  info,
  selectedMonth,
  onSubmit,
}: BudgetFormDialogProps) {
  const [limitInput, setLimitInput] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (info?.budget) {
      setLimitInput(info.budget.limit.toString());
    } else {
      setLimitInput("");
    }
    setError("");
  }, [info, isOpen]);

  if (!info) return null;

  const parsedLimit = parseAmount(limitInput);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (parsedLimit === null || parsedLimit < 0) {
      setError("Vui lòng nhập hạn mức hợp lệ (ví dụ: 2tr, 500k, 1500000).");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(info!.category.id, parsedLimit);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu ngân sách.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ngân sách "${info.category.name}"`}
      description={`Thiết lập hạn mức chi tiêu cho ${formatMonthYear(selectedMonth)}`}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground">
              Hạn mức tối đa <span className="text-rose-500">*</span>
            </label>
            {parsedLimit !== null && (
              <span className="text-xs font-semibold text-primary font-tabular">
                = {formatMoney(parsedLimit)}
              </span>
            )}
          </div>
          <Input
            placeholder="Ví dụ: 3tr, 1.5tr, 500k..."
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Nhập 0 nếu bạn muốn xóa hạn mức của danh mục này.
          </p>
        </div>

        <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Thực tế đã chi tháng này:</span>
            <span className="font-semibold font-tabular text-foreground">{formatMoney(info.status.spent)}</span>
          </div>
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm -mx-5 -mb-4 px-5 py-3.5 border-t border-border/40 flex items-center justify-end gap-2.5 mt-4 z-10 shadow-lg">
          <Button type="button" variant="outline" className="min-h-[40px] px-4" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" className="min-h-[40px] px-5 font-bold" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu hạn mức"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

