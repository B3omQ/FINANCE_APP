import React, { useEffect, useState } from "react";
import type { Account, Goal, NewGoal } from "@/domain/types";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { parseAmount } from "@/shared/lib/parseAmount";
import { formatMoney } from "@/shared/lib/formatMoney";

export interface GoalFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal | null;
  accounts: Account[];
  onSubmit: (data: NewGoal) => Promise<void>;
}

const PRESET_GOAL_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f97316", // orange
  "#eab308", // yellow
  "#06b6d4", // cyan
  "#64748b", // slate
];

const PRESET_GOAL_ICONS = [
  "target",
  "piggy-bank",
  "car",
  "home",
  "laptop",
  "plane",
  "graduation-cap",
  "gift",
  "award",
  "heart",
];

export function GoalFormDialog({
  isOpen,
  onClose,
  goal,
  accounts,
  onSubmit,
}: GoalFormDialogProps) {
  const [name, setName] = useState("");
  const [targetAmountInput, setTargetAmountInput] = useState("");
  const [savedAmountInput, setSavedAmountInput] = useState("0");
  const [targetDate, setTargetDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [color, setColor] = useState("#22c55e");
  const [icon, setIcon] = useState("target");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmountInput(goal.targetAmount.toString());
      setSavedAmountInput(goal.savedAmount.toString());
      setTargetDate(goal.targetDate ?? "");
      setAccountId(goal.accountId ?? "");
      setColor(goal.color || "#22c55e");
      setIcon(goal.icon || "target");
    } else {
      setName("");
      setTargetAmountInput("");
      setSavedAmountInput("0");
      setTargetDate("");
      setAccountId("");
      setColor("#22c55e");
      setIcon("target");
    }
    setError("");
  }, [goal, isOpen]);

  const parsedTarget = parseAmount(targetAmountInput);
  const parsedSaved = savedAmountInput === "0" ? 0 : parseAmount(savedAmountInput);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Vui lòng nhập tên mục tiêu.");
      return;
    }

    if (!parsedTarget || parsedTarget <= 0) {
      setError("Vui lòng nhập số tiền mục tiêu hợp lệ (> 0).");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        targetAmount: parsedTarget,
        savedAmount: parsedSaved ?? 0,
        targetDate: targetDate || null,
        accountId: accountId || null,
        color,
        icon,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu mục tiêu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goal ? "Chỉnh sửa mục tiêu" : "Tạo mục tiêu tiết kiệm mới"}
      description="Đặt mục tiêu và theo dõi tiến độ tích lũy tài chính của bạn."
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Tên mục tiêu <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="Ví dụ: Mua laptop mới, Quỹ khẩn cấp, Du lịch hè..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground">
              Số tiền mục tiêu <span className="text-rose-500">*</span>
            </label>
            {parsedTarget !== null && (
              <span className="text-xs font-semibold text-primary font-tabular">
                = {formatMoney(parsedTarget)}
              </span>
            )}
          </div>
          <Input
            placeholder="Ví dụ: 20tr, 50tr, 10000000..."
            value={targetAmountInput}
            onChange={(e) => setTargetAmountInput(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground">Đã có sẵn (nếu có)</label>
            {parsedSaved !== null && (
              <span className="text-xs font-semibold text-emerald-500 font-tabular">
                = {formatMoney(parsedSaved)}
              </span>
            )}
          </div>
          <Input
            placeholder="Ví dụ: 0, 5tr, 1000000..."
            value={savedAmountInput}
            onChange={(e) => setSavedAmountInput(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Hạn hoàn thành (Tùy chọn)
            </label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Gắn với ví (Tùy chọn)
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background/50 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Không liên kết ví</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Màu sắc</label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_GOAL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === c ? "scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Màu ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Icon picker */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Biểu tượng</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_GOAL_ICONS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                  icon === i
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border/60 hover:bg-muted text-muted-foreground"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm -mx-5 -mb-4 px-5 py-3.5 border-t border-border/40 flex items-center justify-end gap-2.5 mt-4 z-10 shadow-lg">
          <Button type="button" variant="outline" className="min-h-[40px] px-4" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" className="min-h-[40px] px-5 font-bold" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : goal ? "Cập nhật mục tiêu" : "Tạo mục tiêu"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

