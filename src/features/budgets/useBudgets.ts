import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/app/providers";
import { monthRange, shiftMonth, toMonthKey, today } from "@/shared/lib/date";
import { budgetStatus, calculateCategorySpent, type BudgetStatus } from "@/domain/budget";
import type { Budget, Category, ID, Money } from "@/domain/types";

export interface CategoryBudgetInfo {
  category: Category;
  budget?: Budget;
  status: BudgetStatus;
}

export function useBudgets(selectedMonth: string = toMonthKey(today())) {
  const repos = useRepositories();
  const queryClient = useQueryClient();

  const { start: dateFrom, end: dateTo } = useMemo(() => monthRange(selectedMonth), [selectedMonth]);

  // Load budgets for this month
  const budgetsQuery = useQuery({
    queryKey: ["budgets", selectedMonth],
    queryFn: () => repos.budgets.listByMonth(selectedMonth),
  });

  // Load active expense categories
  const categoriesQuery = useQuery({
    queryKey: ["categories", "expense"],
    queryFn: () => repos.categories.list("expense"),
  });

  // Load transactions for this month to calculate spent per category
  const transactionsQuery = useQuery({
    queryKey: ["transactions", { dateFrom, dateTo, type: "expense" }],
    queryFn: () => repos.transactions.list({ dateFrom, dateTo, type: "expense" }),
  });

  const budgets = useMemo(() => budgetsQuery.data ?? [], [budgetsQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const transactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);

  // Map category to budget info
  const items: CategoryBudgetInfo[] = useMemo(() => {
    const budgetMap = new Map<string, Budget>();
    for (const b of budgets) {
      budgetMap.set(b.categoryId, b);
    }

    return categories.map((cat) => {
      const budget = budgetMap.get(cat.id);
      const limit = budget ? budget.limit : 0;
      const spent = calculateCategorySpent(transactions, cat.id);
      const status = budgetStatus(limit, spent);

      return {
        category: cat,
        budget,
        status,
      };
    });
  }, [budgets, categories, transactions]);

  // Overall totals across categories with a defined limit
  const overall = useMemo(() => {
    let totalLimit = 0;
    let totalSpent = 0;

    for (const item of items) {
      if (item.budget && item.budget.limit > 0) {
        totalLimit += item.budget.limit;
        totalSpent += item.status.spent;
      }
    }

    return budgetStatus(totalLimit, totalSpent);
  }, [items]);

  const upsertMutation = useMutation({
    mutationFn: ({ categoryId, limit }: { categoryId: ID; limit: Money }) =>
      repos.budgets.upsert(categoryId, selectedMonth, limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", selectedMonth] });
    },
  });

  const copyPreviousMutation = useMutation({
    mutationFn: () => {
      const prevMonth = shiftMonth(selectedMonth, -1);
      return repos.budgets.copyMonth(prevMonth, selectedMonth);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", selectedMonth] });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (budgetId: ID) => repos.budgets.softDelete(budgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", selectedMonth] });
    },
  });

  return {
    items,
    overall,
    isLoading: budgetsQuery.isLoading || categoriesQuery.isLoading || transactionsQuery.isLoading,
    upsertBudget: upsertMutation.mutateAsync,
    copyPreviousMonth: copyPreviousMutation.mutateAsync,
    deleteBudget: deleteBudgetMutation.mutateAsync,
  };
}

