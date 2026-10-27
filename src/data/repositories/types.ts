import type {
  Account,
  Budget,
  Category,
  CategoryKind,
  DateOnly,
  Goal,
  ID,
  Money,
  NewAccount,
  NewCategory,
  NewGoal,
  NewRecurringRule,
  NewTransaction,
  NewTransfer,
  RecurringRule,
  Transaction,
  TransactionType,
} from "@/domain/types";

export interface TransactionFilter {
  dateFrom?: DateOnly;
  dateTo?: DateOnly;
  accountIds?: ID[];
  categoryIds?: ID[];
  type?: TransactionType;
  search?: string; // tìm trong note
  limit?: number;
  offset?: number;
}

export interface TransactionRepository {
  list(filter?: TransactionFilter): Promise<Transaction[]>;
  get(id: ID): Promise<Transaction | null>;
  create(input: NewTransaction): Promise<Transaction>;
  createTransfer(input: NewTransfer): Promise<[Transaction, Transaction]>; // atomic: outgoing + incoming
  update(id: ID, patch: Partial<NewTransaction>): Promise<Transaction>;
  softDelete(id: ID): Promise<void>; // xóa cả cặp nếu là transfer
  restore(id: ID): Promise<void>; // dùng cho Hoàn tác
}

export interface AccountRepository {
  list(opts?: { includeArchived?: boolean }): Promise<Account[]>;
  get(id: ID): Promise<Account | null>;
  create(input: NewAccount): Promise<Account>;
  update(id: ID, patch: Partial<NewAccount>): Promise<Account>;
  softDelete(id: ID): Promise<void>;
  balances(): Promise<Record<ID, Money>>; // initial_balance + SUM(amount)
}

export interface CategoryRepository {
  list(kind?: CategoryKind): Promise<Category[]>;
  get(id: ID): Promise<Category | null>;
  create(input: NewCategory): Promise<Category>;
  update(id: ID, patch: Partial<NewCategory>): Promise<Category>;
  softDelete(id: ID): Promise<void>;
}

export interface BudgetRepository {
  listByMonth(month: string): Promise<Budget[]>;
  upsert(categoryId: ID, month: string, limit: Money): Promise<Budget>;
  copyMonth(from: string, to: string): Promise<void>;
  softDelete(id: ID): Promise<void>;
}

export interface RecurringRepository {
  list(activeOnly?: boolean): Promise<RecurringRule[]>;
  get(id: ID): Promise<RecurringRule | null>;
  create(input: NewRecurringRule): Promise<RecurringRule>;
  update(id: ID, patch: Partial<NewRecurringRule>): Promise<RecurringRule>;
  softDelete(id: ID): Promise<void>;
  markGenerated(id: ID, date: DateOnly): Promise<void>;
}

export interface GoalRepository {
  list(): Promise<Goal[]>;
  get(id: ID): Promise<Goal | null>;
  create(input: NewGoal): Promise<Goal>;
  update(id: ID, patch: Partial<NewGoal>): Promise<Goal>;
  addSaving(id: ID, amount: Money): Promise<Goal>;
  softDelete(id: ID): Promise<void>;
}

export interface SettingsRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export interface Repositories {
  transactions: TransactionRepository;
  accounts: AccountRepository;
  categories: CategoryRepository;
  budgets: BudgetRepository;
  recurring: RecurringRepository;
  goals: GoalRepository;
  settings: SettingsRepository;
}
