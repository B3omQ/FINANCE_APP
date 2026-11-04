import React, { useState } from "react";
import { useCategories } from "./useCategories";
import { CategoryFormDialog } from "./components/CategoryFormDialog";
import { Button } from "@/shared/ui/Button";
import { CategoryIcon } from "@/shared/ui/CategoryIcon";
import { useToast } from "@/shared/ui/Toast";
import type { Category, CategoryKind, NewCategory } from "@/domain/types";
import { ChevronDown, ChevronUp, Edit3, Plus, Tag, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<CategoryKind>("expense");
  const { categories, isLoading, createCategory, updateCategory, deleteCategory } =
    useCategories(activeTab);

  const { showToast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  async function handleSave(data: NewCategory) {
    if (editingCategory) {
      await updateCategory({ id: editingCategory.id, patch: data });
      showToast({ message: "Đã cập nhật danh mục thành công", type: "success" });
    } else {
      await createCategory(data);
      showToast({ message: "Đã tạo danh mục mới thành công", type: "success" });
    }
  }

  async function handleDelete(cat: Category) {
    if (confirm(`Bạn có chắc muốn xóa danh mục "${cat.name}"?`)) {
      await deleteCategory(cat.id);
      showToast({ message: `Đã xóa danh mục "${cat.name}"`, type: "info" });
    }
  }

  async function handleMoveOrder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const currentCat = categories[index];
    const targetCat = categories[targetIndex];
    if (!currentCat || !targetCat) return;

    const currentOrder = currentCat.sortOrder ?? index;
    const targetOrder = targetCat.sortOrder ?? targetIndex;

    const newCurrentOrder = currentOrder === targetOrder ? targetIndex : targetOrder;
    const newTargetOrder = currentOrder === targetOrder ? index : currentOrder;

    await updateCategory({ id: currentCat.id, patch: { sortOrder: newCurrentOrder } });
    await updateCategory({ id: targetCat.id, patch: { sortOrder: newTargetOrder } });
  }

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Tag size={22} className="text-primary" />
            Quản lý danh mục
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Phân loại các khoản chi tiêu và nguồn thu để dễ dàng theo dõi
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setEditingCategory(null);
            setIsDialogOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus size={16} />
          Thêm danh mục
        </Button>
      </div>

      {/* Tab Switcher: Khoản chi / Khoản thu */}
      <div className="flex border-b border-border/60">
        <button
          type="button"
          onClick={() => setActiveTab("expense")}
          className={cn(
            "pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
            activeTab === "expense"
              ? "border-rose-500 text-rose-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Khoản chi tiêu
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("income")}
          className={cn(
            "pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
            activeTab === "income"
              ? "border-emerald-500 text-emerald-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Khoản thu nhập
        </button>
      </div>

      {/* Category List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Đang tải danh mục...</p>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border p-6">
          <p className="text-sm text-muted-foreground mb-3">Chưa có danh mục nào.</p>
          <Button
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setIsDialogOpen(true);
            }}
          >
            Tạo danh mục đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="group flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all duration-150 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <CategoryIcon name={cat.icon} color={cat.color} size={18} />
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(idx, "up")}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Chuyển lên trước"
                  >
                    <ChevronUp size={14} />
                  </button>
                )}
                {idx < categories.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(idx, "down")}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Chuyển xuống sau"
                  >
                    <ChevronDown size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(cat);
                    setIsDialogOpen(true);
                  }}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Sửa danh mục"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  className="p-1.5 rounded-md hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors"
                  title="Xóa danh mục"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Form Dialog */}
      <CategoryFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        defaultKind={activeTab}
        onSubmit={handleSave}
      />
    </div>
  );
}
