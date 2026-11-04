import React from "react";
import type { Account, Category, DateOnly, Transaction } from "@/domain/types";
import { TransactionItem } from "./TransactionItem";
import { formatMoney } from "@/shared/lib/formatMoney";
import { formatDate, today } from "@/shared/lib/date";

export interface TransactionGroupProps {
  date: DateOnly;
  transactions: Transaction[];
  categoriesMap: Map<string, Category>;
  accountsMap: Map<string, Account>;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export function TransactionGroup({
  date,
  transactions,
  categoriesMap,
  accountsMap,
  onEdit,
  onDelete,
}: TransactionGroupProps) {
  // Calculate day total: income and expense (transfers excluded from daily net)
  let dayIncome = 0;
  let dayExpense = 0;

  for (const tx of transactions) {
    if (tx.type === "income") {
      dayIncome += tx.amount;
    } else if (tx.type === "expense") {
      dayExpense += Math.abs(tx.amount);
    }
  }

  const isToday = date === today();

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden shadow-sm">
      {/* Day Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/40 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">
            {formatDate(date)}
          </span>
          {isToday && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">
              Hôm nay
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 font-tabular font-medium">
          {dayIncome > 0 && (
            <span className="text-emerald-500">+{formatMoney(dayIncome)}</span>
          )}
          {dayExpense > 0 && (
            <span className="text-rose-500">-{formatMoney(dayExpense)}</span>
          )}
        </div>
      </div>

      {/* Transaction list for this date */}
      <div className="divide-y divide-border/20 p-1">
        {transactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            category={tx.categoryId ? categoriesMap.get(tx.categoryId) : null}
            account={accountsMap.get(tx.accountId)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
