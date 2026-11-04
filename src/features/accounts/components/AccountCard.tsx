import React from "react";
import type { Account, Money } from "@/domain/types";
import { formatMoney } from "@/shared/lib/formatMoney";
import { CategoryIcon } from "@/shared/ui/CategoryIcon";
import { Archive, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface AccountCardProps {
  account: Account;
  balance: Money;
  onEdit: (account: Account) => void;
  onArchive: (account: Account) => void;
  onDelete: (account: Account) => void;
}

const TYPE_NAMES: Record<Account["type"], string> = {
  cash: "Tiền mặt",
  bank: "Tài khoản ngân hàng",
  ewallet: "Ví điện tử",
  other: "Khác",
};

export function AccountCard({
  account,
  balance,
  onEdit,
  onArchive,
  onDelete,
}: AccountCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between p-5 rounded-2xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all duration-200 shadow-sm hover:shadow-md",
        account.archived && "opacity-60 bg-muted/20"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <CategoryIcon name={account.icon} color={account.color} size={22} className="p-3" />
          <div>
            <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
              {account.name}
            </h3>
            <span className="text-xs text-muted-foreground">{TYPE_NAMES[account.type]}</span>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(account)}
            title="Sửa ví"
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            onClick={() => onArchive(account)}
            title={account.archived ? "Bỏ lưu trữ" : "Lưu trữ ví"}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Archive size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(account)}
            title="Xóa ví"
            className="p-1.5 rounded-md hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border/40 flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Số dư hiện tại</span>
        <span
          className={cn(
            "text-xl font-bold font-tabular tracking-tight",
            balance < 0 ? "text-rose-500" : "text-foreground"
          )}
        >
          {formatMoney(balance)}
        </span>
      </div>
    </div>
  );
}
