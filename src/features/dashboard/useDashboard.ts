import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRepositories } from "@/app/providers";
import { getLastNMonths, monthRange, shiftMonth, toMonthKey, today } from "@/shared/lib/date";
import { groupByCategory, monthlyTrend, summarizeMonth, type MonthSummary } from "@/domain/report";
import { budgetStatus, calculateCategorySpent } from "@/domain/budget";
import type { Account, Category } from "@/domain/types";

export interface DashboardComparison {
  incomeDiff: number; // current - prev
  incomeDiffPercent: number; // % change
  expenseDiff: number; // current - prev
  expenseDiffPercent: number; // % change
  netDiff: number; // current - prev
}

export function useDashboard(selectedMonth: string = toMonthKey(today())) {
  const repos = useRepositories();

  const prevMonth = useMemo(() => shiftMonth(selectedMonth, -1), [selectedMonth]);
  const sixMonths = useMemo(() => getLastNMonths(6, selectedMonth), [selectedMonth]);
  const oldestMonth = sixMonths[0] ?? selectedMonth;

  // 1. Current month date range
  const { start: currentStart, end: currentEnd } = useMemo(() => monthRange(selectedMonth), [selectedMonth]);
  // 2. Previous month date range
  const { start: prevStart, end: prevEnd } = useMemo(() => monthRange(prevMonth), [prevMonth]);
  // 3. 6-month date range
  const { start: sixMonthStart } = useMemo(() => monthRange(oldestMonth), [oldestMonth]);

  // Load current month transactions
  const currentTxsQuery = useQuery({
    queryKey: ["transactions", { dateFrom: currentStart, dateTo: currentEnd }],
    queryFn: () => repos.transactions.list({ dateFrom: currentStart, dateTo: currentEnd }),
  });

  // Load previous month transactions
  const prevTxsQuery = useQuery({
    queryKey: ["transactions", { dateFrom: prevStart, dateTo: prevEnd }],
    queryFn: () => repos.transactions.list({ dateFrom: prevStart, dateTo: prevEnd }),
  });

  // Load 6-month transactions for trend
  const trendTxsQuery = useQuery({
    queryKey: ["transactions", { dateFrom: sixMonthStart, dateTo: currentEnd }],
    queryFn: () => repos.transactions.list({ dateFrom: sixMonthStart, dateTo: currentEnd }),
  });

  // Load 5 recent transactions overall
  const recentTxsQuery = useQuery({
    queryKey: ["transactions", { limit: 5 }],
    queryFn: () => repos.transactions.list({ limit: 5 }),
  });

  // Load budgets for this month
  const budgetsQuery = useQuery({
    queryKey: ["budgets", selectedMonth],
    queryFn: () => repos.budgets.listByMonth(selectedMonth),
  });

  // Load categories and accounts
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => repos.categories.list(),
  });

  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: () => repos.accounts.list(),
  });

  const currentTxs = useMemo(() => currentTxsQuery.data ?? [], [currentTxsQuery.data]);
  const prevTxs = useMemo(() => prevTxsQuery.data ?? [], [prevTxsQuery.data]);
  const trendTxs = useMemo(() => trendTxsQuery.data ?? [], [trendTxsQuery.data]);
  const recentTxs = useMemo(() => recentTxsQuery.data ?? [], [recentTxsQuery.data]);
  const budgets = useMemo(() => budgetsQuery.data ?? [], [budgetsQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);

  // Mappings
  const categoriesMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const accountsMap = useMemo(() => {
    const map = new Map<string, Account>();
    for (const a of accounts) map.set(a.id, a);
    return map;
  }, [accounts]);

  // Summaries
  const currentSummary: MonthSummary = useMemo(() => summarizeMonth(currentTxs), [currentTxs]);
  const prevSummary: MonthSummary = useMemo(() => summarizeMonth(prevTxs), [prevTxs]);

  // Comparison metrics
  const comparison: DashboardComparison = useMemo(() => {
    const incomeDiff = currentSummary.income - prevSummary.income;
    const incomeDiffPercent =
      prevSummary.income > 0 ? Math.round((incomeDiff / prevSummary.income) * 100) : 0;

    const expenseDiff = currentSummary.expense - prevSummary.expense;
    const expenseDiffPercent =
      prevSummary.expense > 0 ? Math.round((expenseDiff / prevSummary.expense) * 100) : 0;

    const netDiff = currentSummary.net - prevSummary.net;

    return {
      incomeDiff,
      incomeDiffPercent,
      expenseDiff,
      expenseDiffPercent,
      netDiff,
    };
  }, [currentSummary, prevSummary]);

  // Category breakdown for current month (expenses)
  const categoryExpenses = useMemo(() => {
    const groups = groupByCategory(currentTxs, "expense");
    return groups.map((g) => {
      const cat = categoriesMap.get(g.categoryId);
      return {
        id: g.categoryId,
        name: cat?.name ?? "Khác",
        color: cat?.color ?? "#64748b",
        icon: cat?.icon ?? "tag",
        total: g.total,
        count: g.count,
      };
    });
  }, [currentTxs, categoriesMap]);

  // 6-month trend points formatted for chart
  const monthlyTrendData = useMemo(() => {
    const rawPoints = monthlyTrend(trendTxs);
    const map = new Map(rawPoints.map((p) => [p.month, p]));

    return sixMonths.map((m) => {
      const p = map.get(m);
      return {
        month: m,
        income: p?.income ?? 0,
        expense: p?.expense ?? 0,
        net: p?.net ?? 0,
      };
    });
  }, [trendTxs, sixMonths]);

  // Warning budgets for current month
  const warningBudgets = useMemo(() => {
    const result = [];
    for (const b of budgets) {
      if (b.limit <= 0) continue;
      const spent = calculateCategorySpent(currentTxs, b.categoryId);
      const status = budgetStatus(b.limit, spent);
      if (status.level === "warn" || status.level === "over") {
        const cat = categoriesMap.get(b.categoryId);
        result.push({
          budget: b,
          category: cat,
          status,
        });
      }
    }
    // Sort overspent first, then warn
    result.sort((a, b) => b.status.percent - a.status.percent);
    return result;
  }, [budgets, currentTxs, categoriesMap]);

  return {
    currentSummary,
    prevSummary,
    comparison,
    categoryExpenses,
    monthlyTrendData,
    recentTxs,
    warningBudgets,
    categoriesMap,
    accountsMap,
    isLoading:
      currentTxsQuery.isLoading ||
      prevTxsQuery.isLoading ||
      trendTxsQuery.isLoading ||
      recentTxsQuery.isLoading ||
      budgetsQuery.isLoading,
  };
}
