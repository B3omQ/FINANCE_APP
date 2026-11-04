import React from "react";
import type { Account, Category, Transaction } from "@/domain/types";
import { formatMoney } from "@/shared/lib/formatMoney";
import { CategoryIcon } from "@/shared/ui/CategoryIcon";
import { ArrowRightLeft, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface TransactionItemProps {
  transaction: Transaction;
  category?: Category | null;
  account?: Account | null;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export function TransactionItem({
  transaction,
  category,
  account,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const isTransfer = transaction.type === "transfer";
  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";

  return (
    <div
      onClick={() => onEdit(transaction)}
      className="group flex items-center justify-between p-3.5 hover:bg-muted/40 rounded-xl transition-all duration-150 cursor-pointer border border-transparent hover:border-border/40"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {isTransfer ? (
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-sm">
            <ArrowRightLeft size={18} className="stroke-[2.2]" />
          </div>
        ) : (
          <CategoryIcon
            name={category?.icon ?? "tag"}
            color={category?.color ?? "#64748b"}
            size={18}
            className="h-10 w-10 shrink-0 shadow-sm rounded-xl"
          />
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate tracking-tight">
              {transaction.note || category?.name || (isTransfer ? "Chuyển tiền" : "Giao dịch")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 font-medium">
            {account && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary/80 text-foreground/80 text-[10px] font-mono border border-border/40">
                {account.name}
              </span>
            )}
            {category && transaction.note && (
              <span className="truncate text-[11px] text-muted-foreground/80">{category.name}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        {/* Formatted amount */}
        <span
          className={cn(
            "text-sm font-extrabold font-tabular text-right tracking-tight",
            isIncome && "text-emerald-400",
            isExpense && "text-rose-400",
            isTransfer && (transaction.amount > 0 ? "text-blue-300" : "text-blue-400")
          )}
        >
          {formatMoney(transaction.amount, { showSign: true })}
        </span>

        {/* Quick action buttons on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(transaction);
            }}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border/40"
            title="Sửa giao dịch"
          >
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(transaction);
            }}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors border border-transparent hover:border-rose-500/30"
            title="Xóa giao dịch"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
