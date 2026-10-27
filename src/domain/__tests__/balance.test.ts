import { describe, it, expect } from "vitest";
import { accountBalance, calculateAccountsBalances, calculateTotalNetWorth } from "../balance";
import type { Account, Transaction } from "../types";

function createMockTx(partial: Partial<Transaction>): Transaction {
  return {
    id: "tx-1",
    date: "2026-10-27",
    amount: 100000,
    type: "income",
    accountId: "acc-1",
    categoryId: "cat-1",
    note: "",
    transferGroupId: null,
    recurringRuleId: null,
    createdAt: "2026-10-27T00:00:00.000Z",
    updatedAt: "2026-10-27T00:00:00.000Z",
    deletedAt: null,
    ...partial,
  };
}

describe("domain/balance", () => {
  it("calculates balance correctly with income and expense sequence", () => {
    const initial = 500_000;
    const txs: Transaction[] = [
      createMockTx({ amount: 1_000_000, type: "income" }),
      createMockTx({ amount: -200_000, type: "expense" }),
      createMockTx({ amount: -50_000, type: "expense" }),
    ];

    expect(accountBalance(initial, txs)).toBe(1_250_000);
  });

  it("ignores soft-deleted transactions in balance calculation", () => {
    const initial = 1_000_000;
    const txs: Transaction[] = [
      createMockTx({ amount: -200_000, type: "expense" }),
      createMockTx({
        amount: -500_000,
        type: "expense",
        deletedAt: "2026-10-27T10:00:00.000Z",
      }),
    ];

    expect(accountBalance(initial, txs)).toBe(800_000);
  });

  it("calculates multiple accounts balances correctly", () => {
    const accounts: Account[] = [
      {
        id: "acc-1",
        name: "Tiền mặt",
        type: "cash",
        initialBalance: 200_000,
        color: "#22c55e",
        icon: "wallet",
        archived: false,
        sortOrder: 0,
        createdAt: "",
        updatedAt: "",
        deletedAt: null,
      },
      {
        id: "acc-2",
        name: "Ngân hàng",
        type: "bank",
        initialBalance: 5_000_000,
        color: "#3b82f6",
        icon: "landmark",
        archived: false,
        sortOrder: 1,
        createdAt: "",
        updatedAt: "",
        deletedAt: null,
      },
    ];

    const txs: Transaction[] = [
      createMockTx({ accountId: "acc-1", amount: -50_000 }),
      createMockTx({ accountId: "acc-2", amount: 2_000_000 }),
      createMockTx({ accountId: "acc-1", amount: -30_000, deletedAt: "2026-10-27" }),
    ];

    const balances = calculateAccountsBalances(accounts, txs);
    expect(balances["acc-1"]).toBe(150_000);
    expect(balances["acc-2"]).toBe(7_000_000);

    const netWorth = calculateTotalNetWorth(accounts, balances);
    expect(netWorth).toBe(7_150_000);
  });
});
