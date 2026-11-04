import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryRepositories } from "@/data/repositories/memory";
import { processDueRecurringRules } from "../recurring/useRecurringAutoProcess";
import { budgetStatus, calculateCategorySpent } from "@/domain/budget";
import { groupByCategory, monthlyTrend, summarizeMonth } from "@/domain/report";
import type { Repositories } from "@/data/repositories/types";

describe("Phase 3 Criteria & Integration Test Suite", () => {
  let repos: Repositories;

  beforeEach(async () => {
    repos = await createMemoryRepositories({ seed: true });
  });

  it("CRITERIA 1 & 2: Dashboard stats match hand-calculated totals and transfers are excluded", async () => {
    const acc1 = await repos.accounts.create({
      name: "Ví Chính",
      type: "bank",
      initialBalance: 10_000_000,
    });
    const acc2 = await repos.accounts.create({
      name: "Ví Tiết Kiệm",
      type: "bank",
      initialBalance: 0,
    });

    const expenseCategories = await repos.categories.list("expense");
    const incomeCategories = await repos.categories.list("income");

    const catFood = expenseCategories.find((c) => c.name === "Ăn uống") ?? expenseCategories[0]!;
    const catTravel = expenseCategories.find((c) => c.name === "Đi lại") ?? expenseCategories[1]!;
    const catSalary = incomeCategories.find((c) => c.name === "Lương") ?? incomeCategories[0]!;
    const catBonus = incomeCategories.find((c) => c.name === "Thưởng") ?? incomeCategories[1]!;

    // Hand-crafted transactions for month 2026-10:
    // Income 1: 15,000,000 (Salary)
    await repos.transactions.create({
      date: "2026-10-05",
      amount: 15_000_000,
      type: "income",
      accountId: acc1.id,
      categoryId: catSalary.id,
      note: "Lương tháng 10",
    });

    // Income 2: 3,000,000 (Bonus)
    await repos.transactions.create({
      date: "2026-10-10",
      amount: 3_000_000,
      type: "income",
      accountId: acc1.id,
      categoryId: catBonus.id,
      note: "Thưởng KPI",
    });

    // Expense 1: -1,200,000 (Food)
    await repos.transactions.create({
      date: "2026-10-08",
      amount: -1_200_000,
      type: "expense",
      accountId: acc1.id,
      categoryId: catFood.id,
      note: "Tiệc công ty",
    });

    // Expense 2: -800,000 (Food)
    await repos.transactions.create({
      date: "2026-10-12",
      amount: -800_000,
      type: "expense",
      accountId: acc1.id,
      categoryId: catFood.id,
      note: "Siêu thị ăn uống",
    });

    // Expense 3: -500,000 (Travel)
    await repos.transactions.create({
      date: "2026-10-15",
      amount: -500_000,
      type: "expense",
      accountId: acc1.id,
      categoryId: catTravel.id,
      note: "Đổ xăng",
    });

    // Transfer: 5,000,000 from acc1 to acc2 (MUST BE EXCLUDED FROM DASHBOARD INCOME & EXPENSE)
    await repos.transactions.createTransfer({
      date: "2026-10-20",
      amount: 5_000_000,
      fromAccountId: acc1.id,
      toAccountId: acc2.id,
      note: "Chuyển tiền tích lũy",
    });

    // Manual hand calculation:
    // Hand Income: 15,000,000 + 3,000,000 = 18,000,000
    const handSumIncome = 15_000_000 + 3_000_000;
    // Hand Expense: 1,200,000 + 800,000 + 500,000 = 2,500,000
    const handSumExpense = 1_200_000 + 800_000 + 500_000;
    // Hand Net: 18,000,000 - 2,500,000 = 15,500,000
    const handNet = handSumIncome - handSumExpense;

    // Fetch transactions for October 2026
    const octTxs = await repos.transactions.list({
      dateFrom: "2026-10-01",
      dateTo: "2026-10-31",
    });

    // Verify summarizeMonth matches hand calculation
    const summary = summarizeMonth(octTxs);
    expect(summary.income).toBe(handSumIncome);
    expect(summary.expense).toBe(handSumExpense);
    expect(summary.net).toBe(handNet);
    expect(summary.transactionCount).toBe(5); // 2 income + 3 expense (transfers excluded!)

    // Verify category breakdown matches hand calculation
    const catExpenses = groupByCategory(octTxs, "expense");
    const foodSummary = catExpenses.find((c) => c.categoryId === catFood.id);
    const travelSummary = catExpenses.find((c) => c.categoryId === catTravel.id);

    expect(foodSummary?.total).toBe(2_000_000); // 1.2m + 0.8m
    expect(foodSummary?.count).toBe(2);
    expect(travelSummary?.total).toBe(500_000);
    expect(travelSummary?.count).toBe(1);

    // Verify monthly trend points
    const trend = monthlyTrend(octTxs);
    const octTrend = trend.find((t) => t.month === "2026-10");
    expect(octTrend?.income).toBe(handSumIncome);
    expect(octTrend?.expense).toBe(handSumExpense);
    expect(octTrend?.net).toBe(handNet);
  });

  it("CRITERIA 3: Opening app 3 times consecutively never duplicates recurring transactions", async () => {
    const acc = await repos.accounts.create({
      name: "Ví Sinh Giao Dịch",
      type: "cash",
      initialBalance: 10_000_000,
    });
    const cat = (await repos.categories.list("expense"))[0]!;

    // Create a monthly recurring rule due on 2026-10-01
    const rule = await repos.recurring.create({
      name: "Tiền thuê nhà tháng 10",
      type: "expense",
      amount: 3_500_000,
      accountId: acc.id,
      categoryId: cat.id,
      frequency: "monthly",
      interval: 1,
      startDate: "2026-10-01",
    });

    const targetDate = "2026-10-15";

    // OPEN 1: First time opening app
    const res1 = await processDueRecurringRules(repos, targetDate);
    expect(res1.generatedCount).toBe(1);
    expect(res1.processedRuleCount).toBe(1);

    // Check transaction was created
    let txs = await repos.transactions.list({ accountIds: [acc.id] });
    expect(txs).toHaveLength(1);
    expect(txs[0]?.amount).toBe(-3_500_000);
    expect(txs[0]?.recurringRuleId).toBe(rule.id);
    expect(txs[0]?.date).toBe("2026-10-01");

    // Check account balance deducted 3.5m
    let balances = await repos.accounts.balances();
    expect(balances[acc.id]).toBe(6_500_000);

    // OPEN 2: Second time opening app immediately on same day
    const res2 = await processDueRecurringRules(repos, targetDate);
    expect(res2.generatedCount).toBe(0);
    expect(res2.processedRuleCount).toBe(0);

    // OPEN 3: Third time opening app
    const res3 = await processDueRecurringRules(repos, targetDate);
    expect(res3.generatedCount).toBe(0);
    expect(res3.processedRuleCount).toBe(0);

    // Total transactions remain exactly 1, no duplicate entries created
    txs = await repos.transactions.list({ accountIds: [acc.id] });
    expect(txs).toHaveLength(1);

    // Balance remains exactly 6,500,000
    balances = await repos.accounts.balances();
    expect(balances[acc.id]).toBe(6_500_000);
  });

  it("CRITERIA 4: Budget status thresholds change color levels correctly at 80% and 100%", () => {
    const limit = 1_000_000;

    // Below 80%: level must be 'ok'
    const status0 = budgetStatus(limit, 0);
    expect(status0.level).toBe("ok");
    expect(status0.percent).toBe(0);
    expect(status0.remaining).toBe(1_000_000);

    const status50 = budgetStatus(limit, 500_000);
    expect(status50.level).toBe("ok");
    expect(status50.percent).toBe(50);
    expect(status50.remaining).toBe(500_000);

    const status79 = budgetStatus(limit, 790_000);
    expect(status79.level).toBe("ok");
    expect(status79.percent).toBe(79);

    // Exactly 80%: level must be 'warn'
    const status80 = budgetStatus(limit, 800_000);
    expect(status80.level).toBe("warn");
    expect(status80.percent).toBe(80);
    expect(status80.remaining).toBe(200_000);

    // Between 80% and 100%: level must be 'warn'
    const status95 = budgetStatus(limit, 950_000);
    expect(status95.level).toBe("warn");
    expect(status95.percent).toBe(95);

    // Exactly 100%: level must be 'warn' (reached 100% boundary)
    const status100 = budgetStatus(limit, 1_000_000);
    expect(status100.level).toBe("warn");
    expect(status100.percent).toBe(100);
    expect(status100.remaining).toBe(0);

    // Strictly > 100%: level must be 'over'
    const status101 = budgetStatus(limit, 1_010_000);
    expect(status101.level).toBe("over");
    expect(status101.percent).toBe(101);
    expect(status101.remaining).toBe(-10_000);

    const status150 = budgetStatus(limit, 1_500_000);
    expect(status150.level).toBe("over");
    expect(status150.percent).toBe(150);
    expect(status150.remaining).toBe(-500_000);
  });

  it("CRITERIA 4 (Integration): Category spending and budget copy month", async () => {
    const acc = await repos.accounts.create({
      name: "Ví Ngân Sách",
      type: "cash",
      initialBalance: 5_000_000,
    });
    const cat = (await repos.categories.list("expense"))[0]!;

    // Set budget for 2026-10: 2,000,000
    await repos.budgets.upsert(cat.id, "2026-10", 2_000_000);

    // Add 2 expenses: 1,000,000 and 700,000 = 1,700,000 (85% -> warn)
    await repos.transactions.create({
      date: "2026-10-05",
      amount: -1_000_000,
      type: "expense",
      accountId: acc.id,
      categoryId: cat.id,
    });
    await repos.transactions.create({
      date: "2026-10-10",
      amount: -700_000,
      type: "expense",
      accountId: acc.id,
      categoryId: cat.id,
    });

    const octTxs = await repos.transactions.list({
      dateFrom: "2026-10-01",
      dateTo: "2026-10-31",
      type: "expense",
    });

    const spent = calculateCategorySpent(octTxs, cat.id);
    expect(spent).toBe(1_700_000);

    const status = budgetStatus(2_000_000, spent);
    expect(status.percent).toBe(85);
    expect(status.level).toBe("warn");

    // Copy month to 2026-11
    await repos.budgets.copyMonth("2026-10", "2026-11");
    const novBudgets = await repos.budgets.listByMonth("2026-11");
    const novCatBudget = novBudgets.find((b) => b.categoryId === cat.id);
    expect(novCatBudget).toBeDefined();
    expect(novCatBudget?.limit).toBe(2_000_000);
  });

  it("FEATURE GOALS: Tracks savings progress and completion", async () => {
    const goal = await repos.goals.create({
      name: "Quỹ Dự Phòng 3 Tháng",
      targetAmount: 15_000_000,
      savedAmount: 5_000_000,
    });

    expect(goal.savedAmount).toBe(5_000_000);

    // Add saving: +5,000,000 -> 10,000,000 (67%)
    const updated1 = await repos.goals.addSaving(goal.id, 5_000_000);
    expect(updated1.savedAmount).toBe(10_000_000);

    // Add saving: +5,000,000 -> 15,000,000 (100% completed)
    const updated2 = await repos.goals.addSaving(goal.id, 5_000_000);
    expect(updated2.savedAmount).toBe(15_000_000);
  });
});

