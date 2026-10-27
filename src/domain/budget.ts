import type { ID, Money, Transaction } from "./types";

export type BudgetLevel = "ok" | "warn" | "over";

export interface BudgetStatus {
  spent: Money; // Dương
  limit: Money; // Dương
  remaining: Money; // limit - spent (có thể âm nếu over)
  percent: number; // 0 - 100+ %
  level: BudgetLevel;
}

/**
 * Calculates budget status and warning level.
 * Level:
 * - 'ok': < 80%
 * - 'warn': 80% - 100%
 * - 'over': > 100%
 */
export function budgetStatus(limit: Money, spent: Money): BudgetStatus {
  const safeSpent = Math.max(0, spent);
  const safeLimit = Math.max(0, limit);
  const remaining = safeLimit - safeSpent;

  let percent = 0;
  if (safeLimit > 0) {
    percent = Math.round((safeSpent / safeLimit) * 100);
  } else if (safeSpent > 0) {
    percent = 100;
  }

  let level: BudgetLevel = "ok";
  if (percent > 100) {
    level = "over";
  } else if (percent >= 80) {
    level = "warn";
  }

  return {
    spent: safeSpent,
    limit: safeLimit,
    remaining,
    percent,
    level,
  };
}

/**
 * Calculates total spent for a specific category in a given month/period.
 * Invariant Rule:
 * - Only includes active transactions (deleted_at is null)
 * - Only includes type === 'expense'
 * - NEVER includes transfers
 * - Returns a positive number representing total spending
 */
export function calculateCategorySpent(
  transactions: Transaction[],
  categoryId: ID
): Money {
  let totalSpent = 0;

  for (const tx of transactions) {
    if (tx.deletedAt !== null) continue;
    if (tx.type !== "expense") continue;
    if (tx.categoryId !== categoryId) continue;

    // In DB, expense amount is negative; we accumulate absolute value
    totalSpent += Math.abs(tx.amount);
  }

  return totalSpent;
}
