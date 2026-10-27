import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryRepositories } from "../memory";
import { createSqliteRepositories } from "../sqlite";
import { createTestSqliteDb } from "@/data/db/testSqliteDb";
import { initializeDatabase } from "@/data/db/client";
import { summarizeMonth } from "@/domain/report";
import type { Repositories } from "../types";

// Factory for both implementations
const implementations: { name: string; init: () => Promise<Repositories> }[] = [
  {
    name: "Memory Repository",
    init: async () => createMemoryRepositories({ seed: true }),
  },
  {
    name: "SQLite Repository",
    init: async () => {
      const db = await createTestSqliteDb();
      return createSqliteRepositories(db);
    },
  },
];

describe.each(implementations)("$name implementation suite", ({ name, init }) => {
  let repos: Repositories;

  beforeEach(async () => {
    repos = await init();
  });

  it("seeds initial data and does not seed duplicates on second run", async () => {
    const accounts = await repos.accounts.list();
    const categories = await repos.categories.list();

    expect(accounts.length).toBeGreaterThanOrEqual(1);
    expect(accounts.some((a) => a.name === "Tiền mặt")).toBe(true);
    expect(categories.length).toBeGreaterThanOrEqual(14); // 10 expense + 4 income

    // If SQLite, re-run initialization and verify counts remain unchanged
    if (name === "SQLite Repository") {
      const db = await createTestSqliteDb();
      await initializeDatabase(db); // Second run
      const accountsAfter = await repos.accounts.list();
      expect(accountsAfter.length).toBe(accounts.length);
    }
  });

  it("MANDATORY: computes account balance accurately after a series of transactions", async () => {
    const acc = await repos.accounts.create({
      name: "Tài khoản Test",
      type: "bank",
      initialBalance: 1_000_000,
    });

    const cat = (await repos.categories.list("expense"))[0]!;

    // 1. Expense: -200,000
    await repos.transactions.create({
      date: "2026-10-27",
      amount: -200_000,
      type: "expense",
      accountId: acc.id,
      categoryId: cat.id,
    });

    // 2. Income: +500,000
    await repos.transactions.create({
      date: "2026-10-27",
      amount: 500_000,
      type: "income",
      accountId: acc.id,
    });

    // 3. Expense to be deleted: -100,000
    const txToDelete = await repos.transactions.create({
      date: "2026-10-27",
      amount: -100_000,
      type: "expense",
      accountId: acc.id,
      categoryId: cat.id,
    });

    await repos.transactions.softDelete(txToDelete.id);

    const balances = await repos.accounts.balances();
    // 1,000,000 - 200,000 + 500,000 = 1,300,000 (deleted tx ignored)
    expect(balances[acc.id]).toBe(1_300_000);
  });

  it("MANDATORY: transfer creates atomic pair and does NOT change total income/expense", async () => {
    const acc1 = await repos.accounts.create({
      name: "Ví A",
      type: "cash",
      initialBalance: 2_000_000,
    });
    const acc2 = await repos.accounts.create({
      name: "Ví B",
      type: "bank",
      initialBalance: 500_000,
    });

    // Perform transfer of 500,000 from Ví A to Ví B
    const [fromTx, toTx] = await repos.transactions.createTransfer({
      date: "2026-10-27",
      amount: 500_000,
      fromAccountId: acc1.id,
      toAccountId: acc2.id,
      note: "Chuyển tiền tiết kiệm",
    });

    expect(fromTx.transferGroupId).toBeTruthy();
    expect(fromTx.transferGroupId).toBe(toTx.transferGroupId);
    expect(fromTx.amount).toBe(-500_000);
    expect(toTx.amount).toBe(500_000);
    expect(fromTx.type).toBe("transfer");
    expect(toTx.type).toBe("transfer");

    // Verify wallet balances
    const balances = await repos.accounts.balances();
    expect(balances[acc1.id]).toBe(1_500_000);
    expect(balances[acc2.id]).toBe(1_000_000);

    // Verify report income/expense: transfer must not affect income or expense
    const allTxs = await repos.transactions.list({
      accountIds: [acc1.id, acc2.id],
    });
    const summary = summarizeMonth(allTxs);
    expect(summary.income).toBe(0);
    expect(summary.expense).toBe(0);
    expect(summary.net).toBe(0);
  });

  it("MANDATORY: soft deleting a transfer deletes BOTH lines and updates balances", async () => {
    const acc1 = await repos.accounts.create({
      name: "Ví Nguồn",
      type: "cash",
      initialBalance: 1_000_000,
    });
    const acc2 = await repos.accounts.create({
      name: "Ví Đích",
      type: "bank",
      initialBalance: 0,
    });

    const [fromTx] = await repos.transactions.createTransfer({
      date: "2026-10-27",
      amount: 300_000,
      fromAccountId: acc1.id,
      toAccountId: acc2.id,
    });

    // Balances after transfer: acc1=700k, acc2=300k
    let balances = await repos.accounts.balances();
    expect(balances[acc1.id]).toBe(700_000);
    expect(balances[acc2.id]).toBe(300_000);

    // Soft delete one line of the transfer pair
    await repos.transactions.softDelete(fromTx.id);

    // Both lines must be removed from active transactions
    const remainingTxs = await repos.transactions.list({
      accountIds: [acc1.id, acc2.id],
    });
    expect(remainingTxs).toHaveLength(0);

    // Balances must revert back to initial
    balances = await repos.accounts.balances();
    expect(balances[acc1.id]).toBe(1_000_000);
    expect(balances[acc2.id]).toBe(0);

    // Test Restore
    await repos.transactions.restore(fromTx.id);
    const restoredTxs = await repos.transactions.list({
      accountIds: [acc1.id, acc2.id],
    });
    expect(restoredTxs).toHaveLength(2);

    balances = await repos.accounts.balances();
    expect(balances[acc1.id]).toBe(700_000);
    expect(balances[acc2.id]).toBe(300_000);
  });

  it("manages budgets and copies month correctly", async () => {
    const cat = (await repos.categories.list("expense"))[0]!;

    const b = await repos.budgets.upsert(cat.id, "2026-10", 3_000_000);
    expect(b.limit).toBe(3_000_000);

    // Upsert same month updates limit
    const updated = await repos.budgets.upsert(cat.id, "2026-10", 3_500_000);
    expect(updated.limit).toBe(3_500_000);

    // Copy to next month
    await repos.budgets.copyMonth("2026-10", "2026-11");
    const nextMonthBudgets = await repos.budgets.listByMonth("2026-11");
    expect(nextMonthBudgets.some((item) => item.categoryId === cat.id && item.limit === 3_500_000)).toBe(true);
  });

  it("manages goals and adds savings", async () => {
    const goal = await repos.goals.create({
      name: "Mua Laptop Mới",
      targetAmount: 20_000_000,
    });

    expect(goal.savedAmount).toBe(0);

    const updated = await repos.goals.addSaving(goal.id, 5_000_000);
    expect(updated.savedAmount).toBe(5_000_000);
  });

  it("manages recurring rules and markGenerated", async () => {
    const acc = (await repos.accounts.list())[0]!;
    const cat = (await repos.categories.list("expense"))[0]!;

    const rule = await repos.recurring.create({
      name: "Tiền mạng",
      type: "expense",
      amount: 250_000,
      accountId: acc.id,
      categoryId: cat.id,
      frequency: "monthly",
      startDate: "2026-10-01",
    });

    expect(rule.active).toBe(true);

    await repos.recurring.markGenerated(rule.id, "2026-10-01");
    const reloaded = await repos.recurring.get(rule.id);
    expect(reloaded?.lastGeneratedDate).toBe("2026-10-01");
  });

  it("manages app_settings key-value pairs", async () => {
    await repos.settings.set("theme", "dark");
    expect(await repos.settings.get("theme")).toBe("dark");

    await repos.settings.set("theme", "light");
    expect(await repos.settings.get("theme")).toBe("light");
  });
});
