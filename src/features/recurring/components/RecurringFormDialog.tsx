import React, { useEffect, useState } from "react";
import type { Account, Category, NewRecurringRule, RecurringFrequency, RecurringRule } from "@/domain/types";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { parseAmount } from "@/shared/lib/parseAmount";
import { formatMoney } from "@/shared/lib/formatMoney";
import { today } from "@/shared/lib/date";
import { cn } from "@/shared/lib/cn";

export interface RecurringFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rule?: RecurringRule | null;
  accounts: Account[];
  categories: Category[];
  onSubmit: (data: NewRecurringRule) => Promise<void>;
}

export function RecurringFormDialog({
  isOpen,
  onClose,
  rule,
  accounts,
  categories,
  onSubmit,
}: RecurringFormDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amountInput, setAmountInput] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [interval, setIntervalVal] = useState(1);
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setType(rule.type);
      setAmountInput(rule.amount.toString());
      setAccountId(rule.accountId);
      setCategoryId(rule.categoryId);
      setFrequency(rule.frequency);
      setIntervalVal(rule.interval || 1);
      setStartDate(rule.startDate);
      setEndDate(rule.endDate ?? "");
      setNote(rule.note ?? "");
    } else {
      setName("");
      setType("expense");
      setAmountInput("");
      setAccountId(accounts[0]?.id ?? "");
      const firstCat = categories.find((c) => c.kind === "expense");
      setCategoryId(firstCat?.id ?? categories[0]?.id ?? "");
      setFrequency("monthly");
      setIntervalVal(1);
      setStartDate(today());
      setEndDate("");
      setNote("");
    }
    setError("");
  }, [rule, isOpen, accounts, categories]);

  const parsedAmount = parseAmount(amountInput);
  const relevantCategories = categories.filter((c) => c.kind === type);

  // If type changes and category is invalid, pick first
  function handleTypeChange(nextType: "income" | "expense") {
    setType(nextType);
    const validCats = categories.filter((c) => c.kind === nextType);
    if (!validCats.some((c) => c.id === categoryId)) {
      setCategoryId(validCats[0]?.id ?? "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Vui lòng nhập tên quy tắc định kỳ.");
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ (> 0).");
      return;
    }

    if (!accountId) {
      setError("Vui lòng chọn ví.");
      return;
    }

    if (!categoryId) {
      setError("Vui lòng chọn danh mục.");
      return;
    }

    if (!startDate) {
      setError("Vui lòng chọn ngày bắt đầu.");
      return;
    }

    if (endDate && endDate < startDate) {
      setError("Ngày kết thúc không được trước ngày bắt đầu.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        amount: parsedAmount,
        accountId,
        categoryId,
        frequency,
        interval: Math.max(1, interval),
        startDate,
        endDate: endDate ? endDate : null,
        note: note.trim(),
        active: rule ? rule.active : true,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu quy tắc.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rule ? "Chỉnh sửa quy tắc định kỳ" : "Thêm giao dịch định kỳ mới"}
      description="Tự động ghi nhận thu chi định kỳ khi mở ứng dụng."
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {/* Type toggle */}
        <div className="flex rounded-xl bg-muted/50 p-1 border border-border/40">
          <button
            type="button"
            onClick={() => handleTypeChange("expense")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
              type === "expense"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Khoản chi định kỳ
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("income")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
              type === "income"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Khoản thu định kỳ
          </button>
        </div>

        {/* Rule Name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Tên quy tắc <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="Ví dụ: Tiền thuê nhà, Tiền mạng, Lương hàng tháng..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Amount */}
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
            placeholder="Ví dụ: 3tr, 250k, 500.000..."
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
          />
        </div>

        {/* Account & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Ví tiền <span className="text-rose-500">*</span>
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background/50 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Danh mục <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background/50 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {relevantCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Frequency & Interval */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Chu kỳ lặp</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className="w-full h-9 rounded-md border border-input bg-background/50 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="daily">Hàng ngày</option>
              <option value="weekly">Hàng tuần</option>
              <option value="monthly">Hàng tháng</option>
              <option value="yearly">Hàng năm</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Mỗi N chu kỳ</label>
            <Input
              type="number"
              min={1}
              max={365}
              value={interval}
              onChange={(e) => setIntervalVal(parseInt(e.target.value, 10) || 1)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Start Date & End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Ngày bắt đầu <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Ngày kết thúc (Tùy chọn)
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Ghi chú thêm</label>
          <Input
            placeholder="Ghi chú chi tiết cho giao dịch..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-xs h-9"
          />
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm -mx-5 -mb-4 px-5 py-3.5 border-t border-border/40 flex items-center justify-end gap-2.5 mt-4 z-10 shadow-lg">
          <Button type="button" variant="outline" className="min-h-[40px] px-4" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" className="min-h-[40px] px-5 font-bold" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : rule ? "Cập nhật quy tắc" : "Tạo quy tắc"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

