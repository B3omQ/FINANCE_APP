export type ID = string; // UUID
export type ISODateTime = string; // 2026-10-27T08:30:00.000Z
export type DateOnly = string; // 2026-10-27
export type Money = number; // integer, đơn vị đồng (không dùng float)

export interface BaseEntity {
  id: ID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt: ISODateTime | null;
}

export type AccountType = "cash" | "bank" | "ewallet" | "other";

export interface Account extends BaseEntity {
  name: string;
  type: AccountType;
  initialBalance: Money;
  color: string;
  icon: string;
  archived: boolean;
  sortOrder: number;
}

export type CategoryKind = "income" | "expense";

export interface Category extends BaseEntity {
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
  sortOrder: number;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction extends BaseEntity {
  date: DateOnly;
  amount: Money; // CÓ DẤU: thu (+), chi (-), chuyển đi (-), chuyển đến (+)
  type: TransactionType;
  accountId: ID;
  categoryId: ID | null; // null khi type = 'transfer'
  note: string;
  transferGroupId: ID | null; // cùng giá trị cho 2 dòng của một lần chuyển
  recurringRuleId: ID | null; // nếu sinh ra từ giao dịch định kỳ
}

export interface Budget extends BaseEntity {
  categoryId: ID;
  month: string; // 'YYYY-MM'
  limit: Money; // dương
}

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringRule extends BaseEntity {
  name: string;
  type: "income" | "expense";
  amount: Money; // dương, dấu áp dụng khi sinh giao dịch
  accountId: ID;
  categoryId: ID;
  note: string;
  frequency: RecurringFrequency;
  interval: number; // mỗi N đơn vị
  startDate: DateOnly;
  endDate: DateOnly | null;
  lastGeneratedDate: DateOnly | null;
  active: boolean;
}

export interface Goal extends BaseEntity {
  name: string;
  targetAmount: Money;
  savedAmount: Money;
  targetDate: DateOnly | null;
  accountId: ID | null;
  color: string;
  icon: string;
}

// Input types for creating entities
export interface NewAccount {
  name: string;
  type: AccountType;
  initialBalance?: Money;
  color?: string;
  icon?: string;
  archived?: boolean;
  sortOrder?: number;
}

export interface NewCategory {
  name: string;
  kind: CategoryKind;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface NewTransaction {
  date: DateOnly;
  amount: Money; // Có dấu (+ thu, - chi)
  type: TransactionType;
  accountId: ID;
  categoryId?: ID | null;
  note?: string;
  transferGroupId?: ID | null;
  recurringRuleId?: ID | null;
}

export interface NewTransfer {
  date: DateOnly;
  amount: Money; // Số dương: số tiền muốn chuyển
  fromAccountId: ID;
  toAccountId: ID;
  note?: string;
}

export interface NewRecurringRule {
  name: string;
  type: "income" | "expense";
  amount: Money;
  accountId: ID;
  categoryId: ID;
  note?: string;
  frequency: RecurringFrequency;
  interval?: number;
  startDate: DateOnly;
  endDate?: DateOnly | null;
  active?: boolean;
}

export interface NewGoal {
  name: string;
  targetAmount: Money;
  savedAmount?: Money;
  targetDate?: DateOnly | null;
  accountId?: ID | null;
  color?: string;
  icon?: string;
}
