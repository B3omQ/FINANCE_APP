import type { ID, Money, Transaction } from "./types";

export interface MonthSummary {
  income: Money; // Dương
  expense: Money; // Dương (chi tiêu hiển thị dạng số dương)
  net: Money; // income - expense
  transactionCount: number;
}

export interface CategorySummary {
  categoryId: ID;
  total: Money; // Dương
  count: number;
}

export interface MonthTrendPoint {
  month: string; // YYYY-MM
  income: Money;
  expense: Money;
  net: Money;
}

/**
 * Summarizes income and expense for a list of transactions.
 * Rules:
 * - Ignores soft-deleted transactions
 * - EXCLUDES transfers completely
 * - expense is represented as a positive number
 */
export function summarizeMonth(transactions: Transaction[]): MonthSummary {
  let income = 0;
  let expense = 0;
  let count = 0;

  for (const tx of transactions) {
    if (tx.deletedAt !== null) continue;
    if (tx.type === "transfer") continue; // Never include transfers in income/expense

    if (tx.type === "income") {
      income += tx.amount > 0 ? tx.amount : 0;
      count++;
    } else if (tx.type === "expense") {
      expense += Math.abs(tx.amount);
      count++;
    }
  }

  return {
    income,
    expense,
    net: income - expense,
    transactionCount: count,
  };
}

/**
 * Groups active expenses or incomes by categoryId.
 * Transfers are excluded.
 * Totals are positive amounts.
 */
export function groupByCategory(
  transactions: Transaction[],
  kind: "expense" | "income" = "expense"
): CategorySummary[] {
  const map = new Map<ID, { total: Money; count: number }>();

  for (const tx of transactions) {
    if (tx.deletedAt !== null) continue;
    if (tx.type !== kind) continue;
    if (!tx.categoryId) continue;

    const current = map.get(tx.categoryId) ?? { total: 0, count: 0 };
    current.total += Math.abs(tx.amount);
    current.count += 1;
    map.set(tx.categoryId, current);
  }

  const result: CategorySummary[] = [];
  for (const [categoryId, data] of map.entries()) {
    result.push({
      categoryId,
      total: data.total,
      count: data.count,
    });
  }

  // Sort descending by total amount
  result.sort((a, b) => b.total - a.total);
  return result;
}

/**
 * Calculates monthly trend points (income, expense, net) across a set of transactions.
 */
export function monthlyTrend(transactions: Transaction[]): MonthTrendPoint[] {
  const monthsMap = new Map<string, { income: Money; expense: Money }>();

  for (const tx of transactions) {
    if (tx.deletedAt !== null) continue;
    if (tx.type === "transfer") continue;

    const month = tx.date.slice(0, 7); // 'YYYY-MM'
    const entry = monthsMap.get(month) ?? { income: 0, expense: 0 };

    if (tx.type === "income") {
      entry.income += tx.amount > 0 ? tx.amount : 0;
    } else if (tx.type === "expense") {
      entry.expense += Math.abs(tx.amount);
    }
    monthsMap.set(month, entry);
  }

  const result: MonthTrendPoint[] = [];
  for (const [month, data] of monthsMap.entries()) {
    result.push({
      month,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    });
  }

  result.sort((a, b) => a.month.localeCompare(b.month));
  return result;
}
