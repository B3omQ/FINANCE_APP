import React, { useEffect, useState } from "react";
import type { Category, CategoryKind, NewCategory } from "@/domain/types";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";

export interface CategoryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  defaultKind?: CategoryKind;
  onSubmit: (data: NewCategory) => Promise<void>;
}

const CATEGORY_COLORS = [
  "#f97316", // orange
  "#06b6d4", // cyan
  "#8b5cf6", // purple
  "#eab308", // yellow
  "#ec4899", // pink
  "#ef4444", // red
  "#3b82f6", // blue
  "#14b8a6", // teal
  "#22c55e", // green
  "#64748b", // slate
];

const CATEGORY_ICONS = [
  "utensils",
  "car",
  "home",
  "receipt",
  "shopping-bag",
  "heart-pulse",
  "graduation-cap",
  "gamepad-2",
  "gift",
  "briefcase",
  "award",
  "trending-up",
  "coffee",
  "plane",
  "tag",
];

export function CategoryFormDialog({
  isOpen,
  onClose,
  category,
  defaultKind = "expense",
  onSubmit,
}: CategoryFormDialogProps) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CategoryKind>(defaultKind);
  const [color, setColor] = useState("#f97316");
  const [icon, setIcon] = useState("tag");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setKind(category.kind);
      setColor(category.color);
      setIcon(category.icon);
    } else {
      setName("");
      setKind(defaultKind);
      setColor(defaultKind === "income" ? "#22c55e" : "#f97316");
      setIcon("tag");
    }
    setError("");
  }, [category, defaultKind, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên danh mục.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        kind,
        color,
        icon,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu danh mục.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "Sửa danh mục" : "Thêm danh mục mới"}
      description="Tùy chỉnh nhóm chi tiêu hoặc nguồn thu nhập."
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Loại danh mục</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKind("expense")}
              className={`py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                kind === "expense"
                  ? "border-rose-500 bg-rose-500/10 text-rose-500"
                  : "border-border/60 hover:bg-muted text-muted-foreground"
              }`}
            >
              Khoản chi
            </button>
            <button
              type="button"
              onClick={() => setKind("income")}
              className={`py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                kind === "income"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                  : "border-border/60 hover:bg-muted text-muted-foreground"
              }`}
            >
              Khoản thu
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Tên danh mục <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="Ví dụ: Ăn uống, Giải trí..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Màu sắc
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORY_COLORS.map((c) => (
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

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Biểu tượng
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORY_ICONS.map((i) => (
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
            {isSubmitting ? "Đang lưu..." : category ? "Cập nhật danh mục" : "Tạo danh mục"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
