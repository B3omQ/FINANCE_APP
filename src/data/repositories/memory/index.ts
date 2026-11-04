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
} from "@/domain/types";
import { accountBalance } from "@/domain/balance";
import { generateId } from "@/shared/lib/uuid";
import { nowISO } from "@/shared/lib/date";
import { ALL_DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from "@/data/db/seed";
import type {
  AccountRepository,
  BudgetRepository,
  CategoryRepository,
  GoalRepository,
  RecurringRepository,
  Repositories,
  SettingsRepository,
  TransactionFilter,
  TransactionRepository,
} from "../types";

const STORAGE_KEY = "finance_app_store_v1";

export class MemoryStore {
  accounts: Map<ID, Account> = new Map();
  categories: Map<ID, Category> = new Map();
  transactions: Map<ID, Transaction> = new Map();
  budgets: Map<ID, Budget> = new Map();
  recurringRules: Map<ID, RecurringRule> = new Map();
  goals: Map<ID, Goal> = new Map();
  settings: Map<string, string> = new Map();
  private persist: boolean;

  constructor(persist = false) {
    this.persist = persist;
    if (this.persist) {
      this.load();
    }
  }

  load(): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.accounts)) {
        this.accounts = new Map(data.accounts.map((a: Account) => [a.id, a]));
      }
      if (Array.isArray(data.categories)) {
        this.categories = new Map(data.categories.map((c: Category) => [c.id, c]));
      }
      if (Array.isArray(data.transactions)) {
        this.transactions = new Map(data.transactions.map((t: Transaction) => [t.id, t]));
      }
      if (Array.isArray(data.budgets)) {
        this.budgets = new Map(data.budgets.map((b: Budget) => [b.id, b]));
      }
      if (Array.isArray(data.recurringRules)) {
        this.recurringRules = new Map(data.recurringRules.map((r: RecurringRule) => [r.id, r]));
      }
      if (Array.isArray(data.goals)) {
        this.goals = new Map(data.goals.map((g: Goal) => [g.id, g]));
      }
      if (Array.isArray(data.settings)) {
        this.settings = new Map(data.settings);
      }
    } catch (e) {
      console.warn("Failed to load store from localStorage:", e);
    }
  }

  save(): void {
    if (!this.persist || typeof window === "undefined" || !window.localStorage) return;
    try {
      const payload = {
        accounts: Array.from(this.accounts.values()),
        categories: Array.from(this.categories.values()),
        transactions: Array.from(this.transactions.values()),
        budgets: Array.from(this.budgets.values()),
        recurringRules: Array.from(this.recurringRules.values()),
        goals: Array.from(this.goals.values()),
        settings: Array.from(this.settings.entries()),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to save store to localStorage:", e);
    }
  }

  seed() {
    if (this.settings.get("seeded") === "1") {
      return;
    }

    const now = nowISO();

    for (const acc of DEFAULT_ACCOUNTS) {
      const id = generateId();
      this.accounts.set(id, {
        id,
        name: acc.name,
        type: acc.type,
        initialBalance: acc.initialBalance ?? 0,
        color: acc.color ?? "#22c55e",
        icon: acc.icon ?? "wallet",
        archived: acc.archived ?? false,
        sortOrder: acc.sortOrder ?? 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    }

    for (const cat of ALL_DEFAULT_CATEGORIES) {
      const id = generateId();
      this.categories.set(id, {
        id,
        name: cat.name,
        kind: cat.kind,
        color: cat.color ?? "#64748b",
        icon: cat.icon ?? "tag",
        sortOrder: cat.sortOrder ?? 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    }

    this.settings.set("seeded", "1");
    this.save();
  }
}

export class MemoryTransactionRepository implements TransactionRepository {
  constructor(private store: MemoryStore) {}

  async list(filter?: TransactionFilter): Promise<Transaction[]> {
    let list = Array.from(this.store.transactions.values()).filter((t) => t.deletedAt === null);

    if (filter) {
      if (filter.dateFrom) {
        list = list.filter((t) => t.date >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        list = list.filter((t) => t.date <= filter.dateTo!);
      }
      if (filter.accountIds && filter.accountIds.length > 0) {
        const set = new Set(filter.accountIds);
        list = list.filter((t) => set.has(t.accountId));
      }
      if (filter.categoryIds && filter.categoryIds.length > 0) {
        const set = new Set(filter.categoryIds);
        list = list.filter((t) => t.categoryId !== null && set.has(t.categoryId));
      }
      if (filter.type) {
        list = list.filter((t) => t.type === filter.type);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter((t) => t.note.toLowerCase().includes(q));
      }
    }

    // Sort descending by date, then createdAt
    list.sort((a, b) => {
      const cmp = b.date.localeCompare(a.date);
      if (cmp !== 0) return cmp;
      return b.createdAt.localeCompare(a.createdAt);
    });

    if (filter?.offset || filter?.limit) {
      const start = filter.offset ?? 0;
      const end = filter.limit ? start + filter.limit : undefined;
      return list.slice(start, end);
    }

    return list;
  }

  async get(id: ID): Promise<Transaction | null> {
    const tx = this.store.transactions.get(id);
    if (!tx || tx.deletedAt !== null) return null;
    return { ...tx };
  }

  async create(input: NewTransaction): Promise<Transaction> {
    const now = nowISO();
    const id = generateId();

    const tx: Transaction = {
      id,
      date: input.date,
      amount: input.amount,
      type: input.type,
      accountId: input.accountId,
      categoryId: input.type === "transfer" ? null : (input.categoryId ?? null),
      note: input.note ?? "",
      transferGroupId: input.transferGroupId ?? null,
      recurringRuleId: input.recurringRuleId ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.store.transactions.set(id, tx);
    this.store.save();
    return { ...tx };
  }

  async createTransfer(input: NewTransfer): Promise<[Transaction, Transaction]> {
    const now = nowISO();
    const transferGroupId = generateId();
    const absAmount = Math.abs(input.amount);

    const fromTx: Transaction = {
      id: generateId(),
      date: input.date,
      amount: -absAmount, // Đi: âm
      type: "transfer",
      accountId: input.fromAccountId,
      categoryId: null,
      note: input.note ?? "",
      transferGroupId,
      recurringRuleId: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const toTx: Transaction = {
      id: generateId(),
      date: input.date,
      amount: absAmount, // Đến: dương
      type: "transfer",
      accountId: input.toAccountId,
      categoryId: null,
      note: input.note ?? "",
      transferGroupId,
      recurringRuleId: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.store.transactions.set(fromTx.id, fromTx);
    this.store.transactions.set(toTx.id, toTx);
    this.store.save();

    return [{ ...fromTx }, { ...toTx }];
  }

  async update(id: ID, patch: Partial<NewTransaction>): Promise<Transaction> {
    const existing = this.store.transactions.get(id);
    if (!existing || existing.deletedAt !== null) {
      throw new Error(`Transaction with id ${id} not found.`);
    }

    const updated: Transaction = {
      ...existing,
      ...patch,
      categoryId:
        patch.type === "transfer"
          ? null
          : patch.categoryId !== undefined
            ? patch.categoryId
            : existing.categoryId,
      updatedAt: nowISO(),
    };

    this.store.transactions.set(id, updated);

    // If part of a transfer group, keep the paired transaction in sync (amount with opposite sign, date, note)
    if (existing.transferGroupId) {
      for (const [otherId, other] of this.store.transactions.entries()) {
        if (
          other.transferGroupId === existing.transferGroupId &&
          otherId !== id &&
          other.deletedAt === null
        ) {
          this.store.transactions.set(otherId, {
            ...other,
            amount: patch.amount !== undefined ? -patch.amount : other.amount,
            date: patch.date !== undefined ? patch.date : other.date,
            note: patch.note !== undefined ? patch.note : other.note,
            updatedAt: nowISO(),
          });
        }
      }
    }

    this.store.save();
    return { ...updated };
  }

  async softDelete(id: ID): Promise<void> {
    const existing = this.store.transactions.get(id);
    if (!existing) return;

    const now = nowISO();

    // Rule: if transfer, soft delete both in the pair
    if (existing.transferGroupId) {
      for (const [txId, tx] of this.store.transactions.entries()) {
        if (tx.transferGroupId === existing.transferGroupId && tx.deletedAt === null) {
          this.store.transactions.set(txId, {
            ...tx,
            deletedAt: now,
            updatedAt: now,
          });
        }
      }
    } else {
      this.store.transactions.set(id, {
        ...existing,
        deletedAt: now,
        updatedAt: now,
      });
    }
    this.store.save();
  }

  async restore(id: ID): Promise<void> {
    const existing = this.store.transactions.get(id);
    if (!existing) return;

    const now = nowISO();

    if (existing.transferGroupId) {
      for (const [txId, tx] of this.store.transactions.entries()) {
        if (tx.transferGroupId === existing.transferGroupId) {
          this.store.transactions.set(txId, {
            ...tx,
            deletedAt: null,
            updatedAt: now,
          });
        }
      }
    } else {
      this.store.transactions.set(id, {
        ...existing,
        deletedAt: null,
        updatedAt: now,
      });
    }
    this.store.save();
  }
}

export class MemoryAccountRepository implements AccountRepository {
  constructor(private store: MemoryStore) {}

  async list(opts?: { includeArchived?: boolean }): Promise<Account[]> {
    let list = Array.from(this.store.accounts.values()).filter((a) => a.deletedAt === null);
    if (!opts?.includeArchived) {
      list = list.filter((a) => !a.archived);
    }
    list.sort((a, b) => a.sortOrder - b.sortOrder);
    return list.map((a) => ({ ...a }));
  }

  async get(id: ID): Promise<Account | null> {
    const acc = this.store.accounts.get(id);
    if (!acc || acc.deletedAt !== null) return null;
    return { ...acc };
  }

  async create(input: NewAccount): Promise<Account> {
    const now = nowISO();
    const id = generateId();

    const acc: Account = {
      id,
      name: input.name,
      type: input.type,
      initialBalance: input.initialBalance ?? 0,
      color: input.color ?? "#64748b",
      icon: input.icon ?? "wallet",
      archived: input.archived ?? false,
      sortOrder: input.sortOrder ?? this.store.accounts.size,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.store.accounts.set(id, acc);
    this.store.save();
    return { ...acc };
  }

  async update(id: ID, patch: Partial<NewAccount>): Promise<Account> {
    const existing = this.store.accounts.get(id);
    if (!existing || existing.deletedAt !== null) {
      throw new Error(`Account with id ${id} not found.`);
    }

    const updated: Account = {
      ...existing,
      ...patch,
      updatedAt: nowISO(),
    };

    this.store.accounts.set(id, updated);
    this.store.save();
    return { ...updated };
  }

  async softDelete(id: ID): Promise<void> {
    const existing = this.store.accounts.get(id);
    if (!existing) return;

    this.store.accounts.set(id, {
      ...existing,
      deletedAt: nowISO(),
      updatedAt: nowISO(),
    });
    this.store.save();
  }

  async balances(): Promise<Record<ID, Money>> {
    const accounts = Array.from(this.store.accounts.values()).filter((a) => a.deletedAt === null);
    const txs = Array.from(this.store.transactions.values()).filter((t) => t.deletedAt === null);

    const result: Record<ID, Money> = {};
    for (const acc of accounts) {
      const accTxs = txs.filter((t) => t.accountId === acc.id);
      result[acc.id] = accountBalance(acc.initialBalance, accTxs);
    }

    return result;
  }
}

export class MemoryCategoryRepository implements CategoryRepository {
  constructor(private store: MemoryStore) {}

  async list(kind?: CategoryKind): Promise<Category[]> {
    let list = Array.from(this.store.categories.values()).filter((c) => c.deletedAt === null);
    if (kind) {
      list = list.filter((c) => c.kind === kind);
    }
    list.sort((a, b) => a.sortOrder - b.sortOrder);
    return list.map((c) => ({ ...c }));
  }

  async get(id: ID): Promise<Category | null> {
    const cat = this.store.categories.get(id);
    if (!cat || cat.deletedAt !== null) return null;
    return { ...cat };
  }

  async create(input: NewCategory): Promise<Category> {
    const now = nowISO();
    const id = generateId();

    const cat: Category = {
      id,
      name: input.name,
      kind: input.kind,
      color: input.color ?? "#64748b",
      icon: input.icon ?? "tag",
      sortOrder: input.sortOrder ?? this.store.categories.size,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.store.categories.set(id, cat);
    this.store.save();
    return { ...cat };
  }

  async update(id: ID, patch: Partial<NewCategory>): Promise<Category> {
    const existing = this.store.categories.get(id);
    if (!existing || existing.deletedAt !== null) {
      throw new Error(`Category with id ${id} not found.`);
    }

    const updated: Category = {
      ...existing,
      ...patch,
      updatedAt: nowISO(),
    };

    this.store.categories.set(id, updated);
    this.store.save();
    return { ...updated };
  }

  async softDelete(id: ID): Promise<void> {
    const existing = this.store.categories.get(id);
    if (!existing) return;

    this.store.categories.set(id, {
      ...existing,
      deletedAt: nowISO(),
      updatedAt: nowISO(),
    });
    this.store.save();
  }
}

export class MemoryBudgetRepository implements BudgetRepository {
  constructor(private store: MemoryStore) {}

  async listByMonth(month: string): Promise<Budget[]> {
    return Array.from(this.store.budgets.values())
      .filter((b) => b.month === month && b.deletedAt === null)
      .map((b) => ({ ...b }));
  }

  async upsert(categoryId: ID, month: string, limit: Money): Promise<Budget> {
    const existing = Array.from(this.store.budgets.values()).find(
      (b) => b.categoryId === categoryId && b.month === month && b.deletedAt === null
    );

    const now = nowISO();

    if (existing) {
      const updated: Budget = {
        ...existing,
        limit,
        updatedAt: now,
      };
      this.store.budgets.set(existing.id, updated);
      this.store.save();
      return { ...updated };
    }

    const id = generateId();
    const created: Budget = {
      id,
      categoryId,
      month,
      limit,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.store.budgets.set(id, created);
    this.store.save();
    return { ...created };
  }

  async copyMonth(fromMonth: string, toMonth: string): Promise<void> {
    const sourceBudgets = await this.listByMonth(fromMonth);
    for (const b of sourceBudgets) {
      await this.upsert(b.categoryId, toMonth, b.limit);
    }
  }

  async softDelete(id: ID): Promise<void> {
    const existing = this.store.budgets.get(id);
    if (!existing) return;

    this.store.budgets.set(id, {
      ...existing,
      deletedAt: nowISO(),
      updatedAt: nowISO(),
    });
    this.store.save();
  }
}

export class MemoryRecurringRepository implements RecurringRepository {
  constructor(private store: MemoryStore) {}

  async list(activeOnly?: boolean): Promise<RecurringRule[]> {
    let list = Array.from(this.store.recurringRules.values()).filter((r) => r.deletedAt === null);
    if (activeOnly) {
      list = list.filter((r) => r.active);
    }
    return list.map((r) => ({ ...r }));
  }

  async get(id: ID): Promise<RecurringRule | null> {
    const rule = this.store.recurringRules.get(id);
    if (!rule || rule.deletedAt !== null) return null;
    return { ...rule };
  }

  async create(input: NewRecurringRule): Promise<RecurringRule> {
    const now = nowISO();
    const id = generateId();

    const rule: RecurringRule = {
      id,
      name: input.name,
      type: input.type,
      amount: input.amount,
      accountId: input.accountId,
      categoryId: input.categoryId,
      note: input.note ?? "",
      frequency: input.frequency,
      interval: input.interval ?? 1,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      lastGeneratedDate: null,
      active: input.active !== undefined ? input.active : true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.store.recurringRules.set(id, rule);
    this.store.save();
    return { ...rule };
  }

  async update(id: ID, patch: Partial<NewRecurringRule>): Promise<RecurringRule> {
    const existing = this.store.recurringRules.get(id);
    if (!existing || existing.deletedAt !== null) {
      throw new Error(`Recurring rule with id ${id} not found.`);
    }

    const updated: RecurringRule = {
      ...existing,
      ...patch,
      updatedAt: nowISO(),
    };

    this.store.recurringRules.set(id, updated);
    this.store.save();
    return { ...updated };
  }

  async softDelete(id: ID): Promise<void> {
    const existing = this.store.recurringRules.get(id);
    if (!existing) return;

    this.store.recurringRules.set(id, {
      ...existing,
      deletedAt: nowISO(),
      updatedAt: nowISO(),
    });
    this.store.save();
  }

  async markGenerated(id: ID, date: DateOnly): Promise<void> {
    const existing = this.store.recurringRules.get(id);
    if (!existing) return;

    this.store.recurringRules.set(id, {
      ...existing,
      lastGeneratedDate: date,
      updatedAt: nowISO(),
    });
    this.store.save();
  }
}

export class MemoryGoalRepository implements GoalRepository {
  constructor(private store: MemoryStore) {}

  async list(): Promise<Goal[]> {
    return Array.from(this.store.goals.values())
      .filter((g) => g.deletedAt === null)
      .map((g) => ({ ...g }));
  }

  async get(id: ID): Promise<Goal | null> {
    const goal = this.store.goals.get(id);
    if (!goal || goal.deletedAt !== null) return null;
    return { ...goal };
  }

  async create(input: NewGoal): Promise<Goal> {
    const now = nowISO();
    const id = generateId();

    const goal: Goal = {
      id,
      name: input.name,
      targetAmount: input.targetAmount,
      savedAmount: input.savedAmount ?? 0,
      targetDate: input.targetDate ?? null,
      accountId: input.accountId ?? null,
      color: input.color ?? "#22c55e",
      icon: input.icon ?? "target",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.store.goals.set(id, goal);
    this.store.save();
    return { ...goal };
  }

  async update(id: ID, patch: Partial<NewGoal>): Promise<Goal> {
    const existing = this.store.goals.get(id);
    if (!existing || existing.deletedAt !== null) {
      throw new Error(`Goal with id ${id} not found.`);
    }

    const updated: Goal = {
      ...existing,
      ...patch,
      updatedAt: nowISO(),
    };

    this.store.goals.set(id, updated);
    this.store.save();
    return { ...updated };
  }

  async addSaving(id: ID, amount: Money): Promise<Goal> {
    const existing = this.store.goals.get(id);
    if (!existing || existing.deletedAt !== null) {
      throw new Error(`Goal with id ${id} not found.`);
    }

    const updated: Goal = {
      ...existing,
      savedAmount: existing.savedAmount + amount,
      updatedAt: nowISO(),
    };

    this.store.goals.set(id, updated);
    this.store.save();
    return { ...updated };
  }

  async softDelete(id: ID): Promise<void> {
    const existing = this.store.goals.get(id);
    if (!existing) return;

    this.store.goals.set(id, {
      ...existing,
      deletedAt: nowISO(),
      updatedAt: nowISO(),
    });
    this.store.save();
  }
}

export class MemorySettingsRepository implements SettingsRepository {
  constructor(private store: MemoryStore) {}

  async get(key: string): Promise<string | null> {
    return this.store.settings.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.settings.set(key, value);
    this.store.save();
  }
}

export function createMemoryRepositories(options?: { seed?: boolean; persist?: boolean }): Repositories {
  const store = new MemoryStore(options?.persist ?? false);
  if (options?.seed !== false) {
    store.seed();
  }

  return {
    transactions: new MemoryTransactionRepository(store),
    accounts: new MemoryAccountRepository(store),
    categories: new MemoryCategoryRepository(store),
    budgets: new MemoryBudgetRepository(store),
    recurring: new MemoryRecurringRepository(store),
    goals: new MemoryGoalRepository(store),
    settings: new MemorySettingsRepository(store),
  };
}
