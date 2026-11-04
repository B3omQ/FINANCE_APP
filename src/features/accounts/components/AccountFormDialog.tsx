import React, { useEffect, useState } from "react";
import type { Account, NewAccount } from "@/domain/types";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { parseAmount } from "@/shared/lib/parseAmount";
import { formatMoney } from "@/shared/lib/formatMoney";

export interface AccountFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account | null;
  onSubmit: (data: NewAccount) => Promise<void>;
}

const PRESET_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f97316", // orange
  "#eab308", // yellow
  "#06b6d4", // cyan
  "#64748b", // slate
];

const PRESET_ICONS = [
  "wallet",
  "landmark",
  "credit-card",
  "smartphone",
  "banknote",
  "piggy-bank",
  "coins",
];

export function AccountFormDialog({
  isOpen,
  onClose,
  account,
  onSubmit,
}: AccountFormDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Account["type"]>("bank");
  const [balanceInput, setBalanceInput] = useState("");
  const [color, setColor] = useState("#22c55e");
  const [icon, setIcon] = useState("wallet");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setBalanceInput(account.initialBalance.toString());
      setColor(account.color);
      setIcon(account.icon);
    } else {
      setName("");
      setType("bank");
      setBalanceInput("0");
      setColor("#22c55e");
      setIcon("wallet");
    }
    setError("");
  }, [account, isOpen]);

  const parsedPreview = balanceInput === "0" ? 0 : parseAmount(balanceInput);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên ví.");
      return;
    }

    const initialBalance = balanceInput === "0" ? 0 : (parseAmount(balanceInput) ?? 0);

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        initialBalance,
        color,
        icon,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu ví.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? "Chỉnh sửa ví" : "Thêm ví mới"}
      description="Quản lý thông tin tài khoản hoặc nguồn tiền của bạn."
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Tên ví <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="Ví dụ: MB Bank, Tiền mặt..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Loại ví</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "cash", label: "Tiền mặt" },
              { id: "bank", label: "Ngân hàng" },
              { id: "ewallet", label: "Ví điện tử" },
              { id: "other", label: "Khác" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id as Account["type"])}
                className={`py-2 px-3 text-xs rounded-lg border text-center transition-all ${
                  type === t.id
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border/60 hover:bg-muted text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground">Số dư ban đầu</label>
            {parsedPreview !== null && (
              <span className="text-xs font-semibold text-primary font-tabular">
                = {formatMoney(parsedPreview)}
              </span>
            )}
          </div>
          <Input
            placeholder="Ví dụ: 5tr, 500k, 1.000.000"
            value={balanceInput}
            onChange={(e) => setBalanceInput(e.target.value)}
            disabled={!!account} // Khuyên khích không sửa số dư ban đầu nếu đã có giao dịch
          />
          {account && (
            <p className="text-[11px] text-muted-foreground mt-1">
              * Không chỉnh sửa số dư ban đầu của ví đã hoạt động để bảo đảm tính toán lịch sử.
            </p>
          )}
        </div>

        {/* Color picker */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Màu đại diện
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
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
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Biểu tượng
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_ICONS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
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
            {isSubmitting ? "Đang lưu..." : account ? "Cập nhật ví" : "Tạo ví"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
