import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { TransactionsPage } from "@/features/transactions/TransactionsPage";
import { AccountsPage } from "@/features/accounts/AccountsPage";
import { CategoriesPage } from "@/features/categories/CategoriesPage";
import { BudgetsPage } from "@/features/budgets/BudgetsPage";
import { GoalsPage } from "@/features/goals/GoalsPage";
import { RecurringPage } from "@/features/recurring/RecurringPage";
import { AppearanceSettingsPage } from "@/features/settings/AppearanceSettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "transactions",
        element: <TransactionsPage />,
      },
      {
        path: "accounts",
        element: <AccountsPage />,
      },
      {
        path: "categories",
        element: <CategoriesPage />,
      },
      {
        path: "budgets",
        element: <BudgetsPage />,
      },
      {
        path: "goals",
        element: <GoalsPage />,
      },
      {
        path: "recurring",
        element: <RecurringPage />,
      },
      {
        path: "settings",
        element: <AppearanceSettingsPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
