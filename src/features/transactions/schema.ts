import { z } from "zod";

export const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ (YYYY-MM-DD)"),
  amount: z.number().int("Số tiền phải là số nguyên"),
  type: z.enum(["income", "expense", "transfer"]),
  accountId: z.string().min(1, "Vui lòng chọn ví"),
  categoryId: z.string().nullable().optional(),
  note: z.string().default(""),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
