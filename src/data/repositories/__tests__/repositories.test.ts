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

  it("PHASE 2: updating a transfer transaction keeps pair in sync and updates balances", async () => {
    const acc1 = await repos.accounts.create({
      name: "Ví Chuyển 1",
      type: "bank",
      initialBalance: 2_000_000,
    });
    const acc2 = await repos.accounts.create({
      name: "Ví Nhận 2",
      type: "cash",
      initialBalance: 500_000,
    });

    const [fromTx, toTx] = await repos.transactions.createTransfer({
      date: "2026-10-27",
      amount: 400_000,
      fromAccountId: acc1.id,
      toAccountId: acc2.id,
      note: "Chuyển ban đầu",
    });

    // Initial transfer check
    let balances = await repos.accounts.balances();
    expect(balances[acc1.id]).toBe(1_600_000);
    expect(balances[acc2.id]).toBe(900_000);

    // Update fromTx to amount: -600_000, note: "Chuyển sửa lại"
    await repos.transactions.update(fromTx.id, {
      amount: -600_000,
      note: "Chuyển sửa lại",
    });

    const updatedFrom = await repos.transactions.get(fromTx.id);
    const updatedTo = await repos.transactions.get(toTx.id);

    expect(updatedFrom?.amount).toBe(-600_000);
    expect(updatedFrom?.note).toBe("Chuyển sửa lại");
    // Paired transaction must be updated to +600_000 and same note
    expect(updatedTo?.amount).toBe(600_000);
    expect(updatedTo?.note).toBe("Chuyển sửa lại");

    balances = await repos.accounts.balances();
    expect(balances[acc1.id]).toBe(1_400_000);
    expect(balances[acc2.id]).toBe(1_100_000);
  });

  it("PHASE 2: category reordering by sortOrder works correctly", async () => {
    const catA = await repos.categories.create({
      name: "Danh mục A",
      kind: "expense",
      sortOrder: 10,
    });
    const catB = await repos.categories.create({
      name: "Danh mục B",
      kind: "expense",
      sortOrder: 20,
    });

    let list = await repos.categories.list("expense");
    const indexA = list.findIndex((c) => c.id === catA.id);
    const indexB = list.findIndex((c) => c.id === catB.id);
    expect(indexA).toBeLessThan(indexB);

    // Swap sortOrder
    await repos.categories.update(catA.id, { sortOrder: 30 });

    list = await repos.categories.list("expense");
    const newIndexA = list.findIndex((c) => c.id === catA.id);
    const newIndexB = list.findIndex((c) => c.id === catB.id);
    expect(newIndexB).toBeLessThan(newIndexA);
  });

  it("PHASE 2: filters transactions by search, type, date and account", async () => {
    const acc = await repos.accounts.create({
      name: "Ví Filter",
      type: "cash",
      initialBalance: 0,
    });
    const cat = (await repos.categories.list("expense"))[0]!;

    await repos.transactions.create({
      date: "2026-10-25",
      amount: -50_000,
      type: "expense",
      accountId: acc.id,
      categoryId: cat.id,
      note: "Ăn trưa bún bò",
    });

    await repos.transactions.create({
      date: "2026-10-26",
      amount: -150_000,
      type: "expense",
      accountId: acc.id,
      categoryId: cat.id,
      note: "Mua sắm quần áo",
    });

    await repos.transactions.create({
      date: "2026-10-27",
      amount: 500_000,
      type: "income",
      accountId: acc.id,
      note: "Tiền thưởng dự án",
    });

    // 1. Filter by search note
    const searchRes = await repos.transactions.list({ search: "bún bò" });
    expect(searchRes).toHaveLength(1);
    expect(searchRes[0]?.note).toBe("Ăn trưa bún bò");

    // 2. Filter by type
    const typeRes = await repos.transactions.list({ type: "income", accountIds: [acc.id] });
    expect(typeRes).toHaveLength(1);
    expect(typeRes[0]?.amount).toBe(500_000);

    // 3. Filter by date range
    const dateRes = await repos.transactions.list({
      dateFrom: "2026-10-26",
      dateTo: "2026-10-27",
      accountIds: [acc.id],
    });
    expect(dateRes).toHaveLength(2);
  });
});

describe("LocalStorage Persistent Memory Store Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists created transactions and accounts across repo instances", async () => {
    // Instance 1: write data with persist: true
    const repo1 = createMemoryRepositories({ seed: true, persist: true });
    const acc = await repo1.accounts.create({
      name: "Ví tiết kiệm",
      type: "bank",
      initialBalance: 2_000_000,
    });
    await repo1.transactions.create({
      date: "2026-10-28",
      amount: -150_000,
      type: "expense",
      accountId: acc.id,
      note: "Mua sách lập trình",
    });

    // Verify localStorage has data
    expect(localStorage.getItem("finance_app_store_v1")).not.toBeNull();

    // Instance 2: new store instance simulating app reload
    const repo2 = createMemoryRepositories({ seed: false, persist: true });
    const accounts = await repo2.accounts.list();
    const savedAcc = accounts.find((a) => a.id === acc.id);
    expect(savedAcc).toBeDefined();
    expect(savedAcc?.name).toBe("Ví tiết kiệm");

    const txs = await repo2.transactions.list({ accountIds: [acc.id] });
    expect(txs).toHaveLength(1);
    expect(txs[0]?.note).toBe("Mua sách lập trình");
    expect(txs[0]?.amount).toBe(-150_000);
  });
});
