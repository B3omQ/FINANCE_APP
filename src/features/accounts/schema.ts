import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên ví").max(50, "Tên ví quá dài"),
  type: z.enum(["cash", "bank", "ewallet", "other"]),
  initialBalance: z.number().int("Số dư phải là số nguyên"),
  color: z.string().default("#22c55e"),
  icon: z.string().default("wallet"),
});

export type AccountFormData = z.infer<typeof accountSchema>;

export const transferSchema = z
  .object({
    fromAccountId: z.string().min(1, "Vui lòng chọn ví nguồn"),
    toAccountId: z.string().min(1, "Vui lòng chọn ví đích"),
    amount: z.number().int().positive("Số tiền chuyển phải lớn hơn 0"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ"),
    note: z.string().default(""),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Ví nguồn và ví đích không được trùng nhau",
    path: ["toAccountId"],
  });

export type TransferFormData = z.infer<typeof transferSchema>;
