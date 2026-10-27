import type { Account, ID, Money, Transaction } from "./types";

/**
 * Calculates current balance of an account from initial balance and transaction history.
 * Rule: initial_balance + SUM(amount) for active transactions (deleted_at is null).
 */
export function accountBalance(initialBalance: Money, transactions: Transaction[]): Money {
  let balance = initialBalance;

  for (const tx of transactions) {
    if (tx.deletedAt !== null) {
      continue;
    }
    balance += tx.amount;
  }

  return balance;
}

/**
 * Calculates balances for multiple accounts given a list of transactions.
 */
export function calculateAccountsBalances(
  accounts: Account[],
  transactions: Transaction[]
): Record<ID, Money> {
  const result: Record<ID, Money> = {};

  for (const acc of accounts) {
    result[acc.id] = acc.initialBalance;
  }

  for (const tx of transactions) {
    if (tx.deletedAt !== null) {
      continue;
    }
    const current = result[tx.accountId];
    if (current !== undefined) {
      result[tx.accountId] = current + tx.amount;
    }
  }

  return result;
}

/**
 * Calculates total net worth across non-archived accounts.
 */
export function calculateTotalNetWorth(
  accounts: Account[],
  balances: Record<ID, Money>
): Money {
  let total = 0;
  for (const acc of accounts) {
    if (!acc.archived && acc.deletedAt === null) {
      total += balances[acc.id] ?? acc.initialBalance;
    }
  }
  return total;
}
