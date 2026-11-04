import React from "react";
import type { Account, Category, TransactionType } from "@/domain/types";
import type { TransactionFilter } from "@/data/repositories/types";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { Filter, RotateCcw, Search } from "lucide-react";

export interface TransactionFilterBarProps {
  filter: TransactionFilter;
  onChange: (filter: TransactionFilter) => void;
  accounts: Account[];
  categories: Category[];
}

export function TransactionFilterBar({
  filter,
  onChange,
  accounts,
  categories,
}: TransactionFilterBarProps) {
  const hasActiveFilter =
    filter.dateFrom ||
    filter.dateTo ||
    (filter.accountIds && filter.accountIds.length > 0) ||
    (filter.categoryIds && filter.categoryIds.length > 0) ||
    filter.type ||
    filter.search;

  function handleReset() {
    onChange({});
  }

  return (
    <div className="p-4 rounded-2xl border border-border/60 bg-card/60 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <Filter size={13} className="text-primary" />
          Bộ lọc giao dịch
        </span>

        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
          >
            <RotateCcw size={12} />
            Đặt lại bộ lọc
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
        {/* Search note */}
        <div className="relative md:col-span-1">
          <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Tìm theo ghi chú..."
            value={filter.search ?? ""}
            onChange={(e) => onChange({ ...filter, search: e.target.value || undefined })}
            className="pl-8 h-9 text-xs"
          />
        </div>

        {/* Type select */}
        <div>
          <select
            value={filter.type ?? ""}
            onChange={(e) =>
              onChange({
                ...filter,
                type: (e.target.value as TransactionType) || undefined,
              })
            }
            className="w-full h-9 rounded-md border border-input bg-background/50 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Tất cả loại giao dịch</option>
            <option value="expense">Khoản chi</option>
            <option value="income">Khoản thu</option>
            <option value="transfer">Chuyển khoản</option>
          </select>
        </div>

        {/* Account select */}
        <div>
          <select
            value={filter.accountIds?.[0] ?? ""}
            onChange={(e) =>
              onChange({
                ...filter,
                accountIds: e.target.value ? [e.target.value] : undefined,
              })
            }
            className="w-full h-9 rounded-md border border-input bg-background/50 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Tất cả ví</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category select */}
        <div>
          <select
            value={filter.categoryIds?.[0] ?? ""}
            onChange={(e) =>
              onChange({
                ...filter,
                categoryIds: e.target.value ? [e.target.value] : undefined,
              })
            }
            className="w-full h-9 rounded-md border border-input bg-background/50 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.kind === "expense" ? "Chi" : "Thu"})
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={filter.dateFrom ?? ""}
            onChange={(e) => onChange({ ...filter, dateFrom: e.target.value || undefined })}
            className="h-9 text-xs"
            title="Từ ngày"
          />
          <span className="text-muted-foreground text-xs">-</span>
          <Input
            type="date"
            value={filter.dateTo ?? ""}
            onChange={(e) => onChange({ ...filter, dateTo: e.target.value || undefined })}
            className="h-9 text-xs"
            title="Đến ngày"
          />
        </div>
      </div>
    </div>
  );
}
