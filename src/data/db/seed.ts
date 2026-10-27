import type { NewAccount, NewCategory } from "@/domain/types";

export const DEFAULT_ACCOUNTS: NewAccount[] = [
  {
    name: "Tiền mặt",
    type: "cash",
    initialBalance: 0,
    color: "#22c55e",
    icon: "wallet",
    archived: false,
    sortOrder: 0,
  },
];

export const DEFAULT_EXPENSE_CATEGORIES: NewCategory[] = [
  { name: "Ăn uống", kind: "expense", color: "#f97316", icon: "utensils", sortOrder: 0 },
  { name: "Đi lại", kind: "expense", color: "#06b6d4", icon: "car", sortOrder: 1 },
  { name: "Nhà ở", kind: "expense", color: "#8b5cf6", icon: "home", sortOrder: 2 },
  { name: "Hóa đơn & tiện ích", kind: "expense", color: "#eab308", icon: "receipt", sortOrder: 3 },
  { name: "Mua sắm", kind: "expense", color: "#ec4899", icon: "shopping-bag", sortOrder: 4 },
  { name: "Sức khỏe", kind: "expense", color: "#ef4444", icon: "heart-pulse", sortOrder: 5 },
  { name: "Học tập", kind: "expense", color: "#3b82f6", icon: "graduation-cap", sortOrder: 6 },
  { name: "Giải trí", kind: "expense", color: "#14b8a6", icon: "gamepad-2", sortOrder: 7 },
  { name: "Quà tặng & từ thiện", kind: "expense", color: "#f43f5e", icon: "gift", sortOrder: 8 },
  { name: "Khác", kind: "expense", color: "#64748b", icon: "more-horizontal", sortOrder: 9 },
];

export const DEFAULT_INCOME_CATEGORIES: NewCategory[] = [
  { name: "Lương", kind: "income", color: "#22c55e", icon: "briefcase", sortOrder: 0 },
  { name: "Thưởng", kind: "income", color: "#10b981", icon: "award", sortOrder: 1 },
  { name: "Thu nhập phụ", kind: "income", color: "#84cc16", icon: "trending-up", sortOrder: 2 },
  { name: "Khác", kind: "income", color: "#64748b", icon: "more-horizontal", sortOrder: 3 },
];

export const ALL_DEFAULT_CATEGORIES: NewCategory[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];
