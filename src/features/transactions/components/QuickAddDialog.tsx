import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Account, Category, NewTransaction, NewTransfer, TransactionType } from "@/domain/types";
import type { QuickAddPrefill } from "@/store/uiStore";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { CategoryIcon } from "@/shared/ui/CategoryIcon";
import { parseAmount } from "@/shared/lib/parseAmount";
import { formatMoney } from "@/shared/lib/formatMoney";
import { today } from "@/shared/lib/date";
import { ArrowRightLeft, Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface QuickAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  onSubmitTransaction: (data: NewTransaction) => Promise<void>;
  onSubmitTransfer: (data: NewTransfer) => Promise<void>;
  initialValues?: QuickAddPrefill | null;
}

// Simple keyword-to-category name suggestion mapping
const NOTE_KEYWORD_MAP: Record<string, string> = {
  "ăn": "Ăn uống",
  "cơm": "Ăn uống",
  "phở": "Ăn uống",
  "bún": "Ăn uống",
  "cafe": "Ăn uống",
  "cà phê": "Ăn uống",
  "trà": "Ăn uống",
  "xăng": "Đi lại",
  "grab": "Đi lại",
  "xe": "Đi lại",
  "gửi xe": "Đi lại",
  "taxi": "Đi lại",
  "nhà": "Nhà ở",
  "trọ": "Nhà ở",
  "điện": "Hóa đơn & tiện ích",
  "nước": "Hóa đơn & tiện ích",
  "mạng": "Hóa đơn & tiện ích",
  "wifi": "Hóa đơn & tiện ích",
  "áo": "Mua sắm",
  "quần": "Mua sắm",
  "giày": "Mua sắm",
  "shopee": "Mua sắm",
  "thuốc": "Sức khỏe",
  "khám": "Sức khỏe",
  "học": "Học tập",
  "sách": "Học tập",
  "phim": "Giải trí",
  "game": "Giải trí",
  "lương": "Lương",
  "thưởng": "Thưởng",
};

const LAST_ACCOUNT_KEY = "finance_app_last_account_id";

const QUICK_AMOUNTS = [
  { label: "+10k", value: 10000 },
  { label: "+20k", value: 20000 },
  { label: "+50k", value: 50000 },
  { label: "+100k", value: 100000 },
  { label: "+200k", value: 200000 },
  { label: "+500k", value: 500000 },
  { label: "+1tr", value: 1000000 },
  { label: "+2tr", value: 2000000 },
];

export function QuickAddDialog({
  isOpen,
  onClose,
  accounts,
  categories,
  onSubmitTransaction,
  onSubmitTransfer,
  initialValues,
}: QuickAddDialogProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amountInput, setAmountInput] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [keepOpen, setKeepOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Initialize or restore state when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        if (initialValues.type) setType(initialValues.type as TransactionType);
        if (initialValues.amount) setAmountInput(initialValues.amount.toLocaleString("vi-VN"));
        if (initialValues.note) setNote(initialValues.note);
        if (initialValues.date) setDate(initialValues.date);
        else setDate(today());
      } else {
        setAmountInput("");
        setNote("");
        setDate(today());
      }
      setError("");

      // Read last used account or default to first
      const savedAccId = localStorage.getItem(LAST_ACCOUNT_KEY);
      const accExists = accounts.some((a) => a.id === savedAccId);
      const initialAccId = accExists ? savedAccId! : accounts[0]?.id ?? "";
      setSelectedAccountId(initialAccId);

      // Default destination account for transfers
      const secondaryAcc = accounts.find((a) => a.id !== initialAccId);
      setToAccountId(secondaryAcc?.id ?? accounts[1]?.id ?? "");

      // Focus amount input
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, accounts, initialValues]);

  // Set default category when type or categories change
  const currentCategories = useMemo(
    () => categories.filter((c) => c.kind === (type === "income" ? "income" : "expense")),
    [categories, type]
  );

  useEffect(() => {
    if (type !== "transfer" && currentCategories.length > 0) {
      // Pick first category as default if none selected or invalid
      if (!selectedCategoryId || !currentCategories.some((c) => c.id === selectedCategoryId)) {
        setSelectedCategoryId(currentCategories[0]?.id ?? null);
      }
    }
  }, [type, currentCategories, selectedCategoryId]);

  // Keyword-based category suggestion when user types note (token/phrase matching)
  function handleNoteChange(val: string) {
    setNote(val);
    if (!val.trim() || type === "transfer") return;
    const lower = val.toLowerCase();
    const words = lower.split(/[^\p{L}\p{N}]+/u);

    for (const [kw, catName] of Object.entries(NOTE_KEYWORD_MAP)) {
      const isMatch = kw.includes(" ") ? lower.includes(kw) : words.includes(kw);
      if (isMatch) {
        const matched = currentCategories.find(
          (c) => c.name.toLowerCase() === catName.toLowerCase()
        );
        if (matched) {
          setSelectedCategoryId(matched.id);
          break;
        }
      }
    }
  }

  const parsedAmount = parseAmount(amountInput);

  function handleAddQuickAmount(addVal: number) {
    const current = parsedAmount ?? 0;
    const next = current + addVal;
    setAmountInput(String(next));
    setError("");
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ (ví dụ: 50k, 1tr, 250000).");
      amountInputRef.current?.focus();
      return;
    }

    if (!selectedAccountId) {
      setError("Vui lòng chọn ví giao dịch.");
      return;
    }

    // Save last used account id
    localStorage.setItem(LAST_ACCOUNT_KEY, selectedAccountId);

    setIsSubmitting(true);
    try {
      if (type === "transfer") {
        if (!toAccountId || toAccountId === selectedAccountId) {
          setError("Vui lòng chọn ví đích khác ví nguồn.");
          setIsSubmitting(false);
          return;
        }

        await onSubmitTransfer({
          date,
          amount: parsedAmount,
          fromAccountId: selectedAccountId,
          toAccountId,
          note: note.trim() || "Chuyển tiền giữa ví",
        });
      } else {
        if (!selectedCategoryId) {
          setError("Vui lòng chọn danh mục.");
          setIsSubmitting(false);
          return;
        }

        // Rule 2: Amount is signed in DB
        const signedAmount = type === "expense" ? -parsedAmount : parsedAmount;

        await onSubmitTransaction({
          date,
          amount: signedAmount,
          type,
          accountId: selectedAccountId,
          categoryId: selectedCategoryId,
          note: note.trim(),
        });
      }

      if (keepOpen) {
        // Reset for another transaction
        setAmountInput("");
        setNote("");
        setTimeout(() => amountInputRef.current?.focus(), 50);
      } else {
        onClose();
      }
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
      className="max-w-md p-5"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Switcher Tabs (Chi / Thu / Chuyển khoản) */}
        <div className="flex rounded-xl bg-muted/50 p-1 border border-border/40">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
              type === "expense"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Khoản chi
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
              type === "income"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Khoản thu
          </button>
          <button
            type="button"
            onClick={() => setType("transfer")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
              type === "transfer"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Chuyển khoản
          </button>
        </div>

        {/* Amount Input with live preview */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              Số tiền <span className="text-rose-500">*</span>
            </span>
            {parsedAmount !== null && (
              <span
                className={cn(
                  "text-xs font-bold font-tabular tracking-tight",
                  type === "expense" && "text-rose-500",
                  type === "income" && "text-emerald-500",
                  type === "transfer" && "text-blue-500"
                )}
              >
                = {formatMoney(parsedAmount)}
              </span>
            )}
          </div>
          <Input
            ref={amountInputRef}
            inputMode="text"
            placeholder="Ví dụ: 50k, 1tr2, 2.5tr, 150000..."
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="text-lg font-bold font-tabular h-11"
            autoFocus
          />

          {/* Quick Amount Chips for fast one-handed mobile entry */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 mt-1.5 no-scrollbar -mx-1 px-1">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q.value}
                type="button"
                onClick={() => handleAddQuickAmount(q.value)}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-secondary/80 hover:bg-secondary text-foreground border border-border/50 shrink-0 transition-transform active:scale-95"
              >
                {q.label}
              </button>
            ))}
            {parsedAmount !== null && parsedAmount > 0 && (
              <button
                type="button"
                onClick={() => setAmountInput("")}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-destructive/10 text-destructive border border-destructive/20 shrink-0 transition-transform active:scale-95"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* Categories Chips (For expense & income) */}
        {type !== "transfer" && (
          <div>
            <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Danh mục <span className="text-rose-500">*</span>
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 py-0.5">
              {currentCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all select-none active:scale-95",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border/60 bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CategoryIcon
                      name={cat.icon}
                      color={isSelected ? "#ffffff" : cat.color}
                      size={13}
                      className="p-0.5"
                    />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Transfer: Destination account */}
        {type === "transfer" ? (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <span className="text-xs font-medium text-muted-foreground mb-1 block">Từ ví</span>
              <select
                value={selectedAccountId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === toAccountId) {
                    setToAccountId(selectedAccountId);
                  }
                  setSelectedAccountId(val);
                }}
                className="w-full h-9 rounded-md border border-input bg-background/50 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
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
              onClick={() => {
                const prev = selectedAccountId;
                setSelectedAccountId(toAccountId);
                setToAccountId(prev);
              }}
              className="mt-4 p-2 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Đổi chiều chuyển tiền"
            >
              <ArrowRightLeft size={14} />
            </button>

            <div className="flex-1">
              <span className="text-xs font-medium text-muted-foreground mb-1 block">Đến ví</span>
              <select
                value={toAccountId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === selectedAccountId) {
                    setSelectedAccountId(toAccountId);
                  }
                  setToAccountId(val);
                }}
                className="w-full h-9 rounded-md border border-input bg-background/50 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* Single Account select & Date */
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-1 block">Ví</span>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background/50 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-1 block">Ngày</span>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        )}

        {/* Note input */}
        <div>
          <Input
            placeholder="Ghi chú (tùy chọn, ví dụ: ăn trưa, đổ xăng...)"
            value={note}
            onChange={(e) => handleNoteChange(e.target.value)}
            className="text-xs h-9"
          />
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm -mx-5 -mb-4 px-5 py-3.5 border-t border-border/40 flex items-center justify-between gap-2 z-10 shadow-lg">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepOpen}
              onChange={(e) => setKeepOpen(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span className="hidden xs:inline">Thêm tiếp</span>
          </label>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="min-h-[40px] px-3.5" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "min-h-[40px] px-4 gap-1.5 font-bold",
                type === "expense" && "bg-rose-600 hover:bg-rose-700",
                type === "income" && "bg-emerald-600 hover:bg-emerald-700",
                type === "transfer" && "bg-blue-600 hover:bg-blue-700"
              )}
            >
              <Check size={16} />
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
