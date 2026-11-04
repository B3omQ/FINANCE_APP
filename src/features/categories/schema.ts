import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên danh mục").max(40, "Tên danh mục quá dài"),
  kind: z.enum(["income", "expense"]),
  color: z.string().default("#64748b"),
  icon: z.string().default("tag"),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
