import { describe, it, expect } from "vitest";
import { budgetStatus, calculateCategorySpent } from "../budget";
import type { Transaction } from "../types";

function createMockTx(partial: Partial<Transaction>): Transaction {
  return {
    id: "tx-1",
    date: "2026-10-27",
    amount: -100000,
    type: "expense",
    accountId: "acc-1",
    categoryId: "cat-food",
    note: "",
    transferGroupId: null,
    recurringRuleId: null,
    createdAt: "2026-10-27T00:00:00.000Z",
    updatedAt: "2026-10-27T00:00:00.000Z",
    deletedAt: null,
    ...partial,
  };
}

describe("domain/budget", () => {
  it("computes level ok when spent < 80%", () => {
    const status = budgetStatus(1_000_000, 750_000);
    expect(status.percent).toBe(75);
    expect(status.level).toBe("ok");
    expect(status.remaining).toBe(250_000);
  });

  it("computes level warn when 80% <= spent <= 100%", () => {
    const statusWarn = budgetStatus(1_000_000, 800_000);
    expect(statusWarn.percent).toBe(80);
    expect(statusWarn.level).toBe("warn");

    const statusFull = budgetStatus(1_000_000, 1_000_000);
    expect(statusFull.percent).toBe(100);
    expect(statusFull.level).toBe("warn");
    expect(statusFull.remaining).toBe(0);
  });

  it("computes level over when spent > 100%", () => {
    const statusOver = budgetStatus(1_000_000, 1_200_000);
    expect(statusOver.percent).toBe(120);
    expect(statusOver.level).toBe("over");
    expect(statusOver.remaining).toBe(-200_000);
  });

  it("calculateCategorySpent includes only expense and excludes transfers", () => {
    const txs: Transaction[] = [
      createMockTx({ categoryId: "cat-food", amount: -200_000, type: "expense" }),
      createMockTx({ categoryId: "cat-food", amount: -100_000, type: "expense" }),
      // Transfer must NOT be counted
      createMockTx({ categoryId: null, amount: -500_000, type: "transfer" }),
      // Another category
      createMockTx({ categoryId: "cat-bills", amount: -300_000, type: "expense" }),
      // Deleted expense
      createMockTx({
        categoryId: "cat-food",
        amount: -50_000,
        type: "expense",
        deletedAt: "2026-10-27T00:00:00.000Z",
      }),
    ];

    expect(calculateCategorySpent(txs, "cat-food")).toBe(300_000);
  });
});
