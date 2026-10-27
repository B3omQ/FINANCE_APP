import { describe, it, expect } from "vitest";
import { summarizeMonth, groupByCategory, monthlyTrend } from "../report";
import type { Transaction } from "../types";

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

describe("domain/report", () => {
  it("summarizeMonth accurately calculates income, positive expense and net", () => {
    const txs: Transaction[] = [
      createMockTx({ amount: 15_000_000, type: "income" }),
      createMockTx({ amount: 2_000_000, type: "income" }),
      createMockTx({ amount: -4_500_000, type: "expense" }),
      createMockTx({ amount: -500_000, type: "expense" }),
    ];

    const summary = summarizeMonth(txs);
    expect(summary.income).toBe(17_000_000);
    expect(summary.expense).toBe(5_000_000); // Displayed as positive number
    expect(summary.net).toBe(12_000_000);
    expect(summary.transactionCount).toBe(4);
  });

  it("MANDATORY: transfer does not change total income or expense", () => {
    // 2 transactions of a transfer: -1,000,000 from acc1 and +1,000,000 to acc2
    const txs: Transaction[] = [
      createMockTx({ amount: 10_000_000, type: "income" }),
      createMockTx({ amount: -3_000_000, type: "expense" }),
      // Transfer pair
      createMockTx({
        accountId: "acc-1",
        amount: -1_000_000,
        type: "transfer",
        transferGroupId: "transfer-123",
      }),
      createMockTx({
        accountId: "acc-2",
        amount: 1_000_000,
        type: "transfer",
        transferGroupId: "transfer-123",
      }),
    ];

    const summary = summarizeMonth(txs);
    expect(summary.income).toBe(10_000_000);
    expect(summary.expense).toBe(3_000_000);
    expect(summary.net).toBe(7_000_000);
  });

  it("groupByCategory groups by category and orders by highest expense", () => {
    const txs: Transaction[] = [
      createMockTx({ categoryId: "cat-food", amount: -200_000, type: "expense" }),
      createMockTx({ categoryId: "cat-bills", amount: -500_000, type: "expense" }),
      createMockTx({ categoryId: "cat-food", amount: -150_000, type: "expense" }),
      createMockTx({ categoryId: "cat-other", amount: -50_000, type: "expense" }),
    ];

    const grouped = groupByCategory(txs, "expense");
    expect(grouped).toHaveLength(3);
    expect(grouped[0]?.categoryId).toBe("cat-bills");
    expect(grouped[0]?.total).toBe(500_000);
    expect(grouped[1]?.categoryId).toBe("cat-food");
    expect(grouped[1]?.total).toBe(350_000);
  });

  it("monthlyTrend aggregates by YYYY-MM", () => {
    const txs: Transaction[] = [
      createMockTx({ date: "2026-09-15", amount: 10_000_000, type: "income" }),
      createMockTx({ date: "2026-09-20", amount: -4_000_000, type: "expense" }),
      createMockTx({ date: "2026-10-05", amount: 12_000_000, type: "income" }),
      createMockTx({ date: "2026-10-10", amount: -5_000_000, type: "expense" }),
    ];

    const trend = monthlyTrend(txs);
    expect(trend).toHaveLength(2);
    expect(trend[0]?.month).toBe("2026-09");
    expect(trend[0]?.income).toBe(10_000_000);
    expect(trend[0]?.expense).toBe(4_000_000);
    expect(trend[0]?.net).toBe(6_000_000);

    expect(trend[1]?.month).toBe("2026-10");
    expect(trend[1]?.net).toBe(7_000_000);
  });
});
