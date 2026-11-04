import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QuickAddDialog } from "../components/QuickAddDialog";
import type { Account, Category } from "@/domain/types";

const mockAccounts: Account[] = [
  {
    id: "acc-1",
    name: "Tiền mặt",
    type: "cash",
    initialBalance: 500_000,
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
    initialBalance: 2_000_000,
    color: "#3b82f6",
    icon: "landmark",
    archived: false,
    sortOrder: 1,
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
  },
];

const mockCategories: Category[] = [
  {
    id: "cat-food",
    name: "Ăn uống",
    kind: "expense",
    color: "#f97316",
    icon: "utensils",
    sortOrder: 0,
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
  },
  {
    id: "cat-travel",
    name: "Đi lại",
    kind: "expense",
    color: "#06b6d4",
    icon: "car",
    sortOrder: 1,
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
  },
  {
    id: "cat-salary",
    name: "Lương",
    kind: "income",
    color: "#22c55e",
    icon: "briefcase",
    sortOrder: 0,
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
  },
];

describe("features/transactions/QuickAddDialog", () => {
  it("renders with live shorthand amount preview when typing 50k", async () => {
    const onSubmitTx = vi.fn();
    const onSubmitTransfer = vi.fn();

    render(
      <QuickAddDialog
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmitTransaction={onSubmitTx}
        onSubmitTransfer={onSubmitTransfer}
      />
    );

    const input = screen.getByPlaceholderText(/Ví dụ: 50k/i);
    fireEvent.change(input, { target: { value: "50k" } });

    // Live preview formatted amount should appear
    expect(screen.getByText(/= 50\.000 ₫/i)).toBeInTheDocument();
  });

  it("completes keyboard expense flow under 5s: typing 50k -> choosing category -> Enter submits", async () => {
    const onSubmitTx = vi.fn().mockResolvedValue(undefined);
    const onSubmitTransfer = vi.fn();
    const onClose = vi.fn();

    render(
      <QuickAddDialog
        isOpen={true}
        onClose={onClose}
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmitTransaction={onSubmitTx}
        onSubmitTransfer={onSubmitTransfer}
      />
    );

    const input = screen.getByPlaceholderText(/Ví dụ: 50k/i);
    fireEvent.change(input, { target: { value: "50k" } });

    // Choose 'Ăn uống' category chip
    const foodChip = screen.getByRole("button", { name: /Ăn uống/i });
    fireEvent.click(foodChip);

    // Submit via form submit
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(onSubmitTx).toHaveBeenCalledTimes(1);
    });

    // Check that amount is signed negative for expense
    expect(onSubmitTx).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: -50_000,
        type: "expense",
        categoryId: "cat-food",
        accountId: "acc-1",
      })
    );
  });

  it("automatically suggests category based on note keyword", async () => {
    const onSubmitTx = vi.fn();

    render(
      <QuickAddDialog
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmitTransaction={onSubmitTx}
        onSubmitTransfer={vi.fn()}
      />
    );

    // Type note: 'đổ xăng' -> should match 'Đi lại'
    const noteInput = screen.getByPlaceholderText(/Ghi chú/i);
    fireEvent.change(noteInput, { target: { value: "đổ xăng xe máy" } });

    // Enter amount and submit
    const amountInput = screen.getByPlaceholderText(/Ví dụ: 50k/i);
    fireEvent.change(amountInput, { target: { value: "70k" } });
    fireEvent.submit(amountInput.closest("form")!);

    await waitFor(() => {
      expect(onSubmitTx).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: "cat-travel",
          amount: -70_000,
        })
      );
    });
  });

  it("submits transfer between accounts when transfer tab is selected", async () => {
    const onSubmitTx = vi.fn();
    const onSubmitTransfer = vi.fn().mockResolvedValue(undefined);

    render(
      <QuickAddDialog
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmitTransaction={onSubmitTx}
        onSubmitTransfer={onSubmitTransfer}
      />
    );

    // Switch to transfer tab
    fireEvent.click(screen.getByRole("button", { name: /Chuyển khoản/i }));

    const amountInput = screen.getByPlaceholderText(/Ví dụ: 50k/i);
    fireEvent.change(amountInput, { target: { value: "200k" } });

    fireEvent.submit(amountInput.closest("form")!);

    await waitFor(() => {
      expect(onSubmitTransfer).toHaveBeenCalledTimes(1);
    });

    expect(onSubmitTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 200_000,
        fromAccountId: "acc-1",
        toAccountId: "acc-2",
      })
    );
  });
});
