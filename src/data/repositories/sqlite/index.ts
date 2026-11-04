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
import { generateId } from "@/shared/lib/uuid";
import { nowISO } from "@/shared/lib/date";
import type { SqlDatabase } from "@/data/db/client";
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

// DB Row interfaces
interface TransactionRow {
  id: string;
  date: string;
  amount: number;
  type: string;
  account_id: string;
  category_id: string | null;
  note: string;
  transfer_group_id: string | null;
  recurring_rule_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface AccountRow {
  id: string;
  name: string;
  type: string;
  initial_balance: number;
  color: string;
  icon: string;
  archived: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface CategoryRow {
  id: string;
  name: string;
  kind: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface BudgetRow {
  id: string;
  category_id: string;
  month: string;
  limit: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface RecurringRuleRow {
  id: string;
  name: string;
  type: string;
  amount: number;
  account_id: string;
  category_id: string;
  note: string;
  frequency: string;
  interval: number;
  start_date: string;
  end_date: string | null;
  last_generated_date: string | null;
  active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface GoalRow {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  account_id: string | null;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Mappers
function mapTransaction(r: TransactionRow): Transaction {
  return {
    id: r.id,
    date: r.date,
    amount: r.amount,
    type: r.type as Transaction["type"],
    accountId: r.account_id,
    categoryId: r.category_id,
    note: r.note,
    transferGroupId: r.transfer_group_id,
    recurringRuleId: r.recurring_rule_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapAccount(r: AccountRow): Account {
  return {
    id: r.id,
    name: r.name,
    type: r.type as Account["type"],
    initialBalance: r.initial_balance,
    color: r.color,
    icon: r.icon,
    archived: r.archived === 1,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind as Category["kind"],
    color: r.color,
    icon: r.icon,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapBudget(r: BudgetRow): Budget {
  return {
    id: r.id,
    categoryId: r.category_id,
    month: r.month,
    limit: r.limit,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapRecurring(r: RecurringRuleRow): RecurringRule {
  return {
    id: r.id,
    name: r.name,
    type: r.type as RecurringRule["type"],
    amount: r.amount,
    accountId: r.account_id,
    categoryId: r.category_id,
    note: r.note,
    frequency: r.frequency as RecurringRule["frequency"],
    interval: r.interval,
    startDate: r.start_date,
    endDate: r.end_date,
    lastGeneratedDate: r.last_generated_date,
    active: r.active === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapGoal(r: GoalRow): Goal {
  return {
    id: r.id,
    name: r.name,
    targetAmount: r.target_amount,
    savedAmount: r.saved_amount,
    targetDate: r.target_date,
    accountId: r.account_id,
    color: r.color,
    icon: r.icon,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

export class SqliteTransactionRepository implements TransactionRepository {
  constructor(private db: SqlDatabase) {}

  async list(filter?: TransactionFilter): Promise<Transaction[]> {
    const clauses: string[] = ["deleted_at IS NULL"];
    const params: unknown[] = [];

    if (filter) {
      if (filter.dateFrom) {
        clauses.push("date >= ?");
        params.push(filter.dateFrom);
      }
      if (filter.dateTo) {
        clauses.push("date <= ?");
        params.push(filter.dateTo);
      }
      if (filter.accountIds && filter.accountIds.length > 0) {
        const placeholders = filter.accountIds.map(() => "?").join(",");
        clauses.push(`account_id IN (${placeholders})`);
        params.push(...filter.accountIds);
      }
      if (filter.categoryIds && filter.categoryIds.length > 0) {
        const placeholders = filter.categoryIds.map(() => "?").join(",");
        clauses.push(`category_id IN (${placeholders})`);
        params.push(...filter.categoryIds);
      }
      if (filter.type) {
        clauses.push("type = ?");
        params.push(filter.type);
      }
      if (filter.search) {
        clauses.push("note LIKE ?");
        params.push(`%${filter.search}%`);
      }
    }

    let sql = `SELECT * FROM transactions WHERE ${clauses.join(" AND ")} ORDER BY date DESC, created_at DESC`;

    if (filter?.limit) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(filter.limit, filter.offset ?? 0);
    }

    const rows = await this.db.select<TransactionRow[]>(sql, params);
    return rows.map(mapTransaction);
  }

  async get(id: ID): Promise<Transaction | null> {
    const rows = await this.db.select<TransactionRow[]>(
      "SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL;",
      [id]
    );
    const row = rows[0];
    return row ? mapTransaction(row) : null;
  }

  async create(input: NewTransaction): Promise<Transaction> {
    const id = generateId();
    const now = nowISO();
    const categoryId = input.type === "transfer" ? null : (input.categoryId ?? null);

    await this.db.execute(
      `INSERT INTO transactions (id, date, amount, type, account_id, category_id, note, transfer_group_id, recurring_rule_id, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL);`,
      [
        id,
        input.date,
        input.amount,
        input.type,
        input.accountId,
        categoryId,
        input.note ?? "",
        input.transferGroupId ?? null,
        input.recurringRuleId ?? null,
        now,
        now,
      ]
    );

    const created = await this.get(id);
    if (!created) throw new Error("Failed to create transaction.");
    return created;
  }

  async createTransfer(input: NewTransfer): Promise<[Transaction, Transaction]> {
    const now = nowISO();
    const transferGroupId = generateId();
    const absAmount = Math.abs(input.amount);

    const fromId = generateId();
    const toId = generateId();

    // Outgoing
    await this.db.execute(
      `INSERT INTO transactions (id, date, amount, type, account_id, category_id, note, transfer_group_id, recurring_rule_id, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, 'transfer', ?, NULL, ?, ?, NULL, ?, ?, NULL);`,
      [fromId, input.date, -absAmount, input.fromAccountId, input.note ?? "", transferGroupId, now, now]
    );

    // Incoming
    await this.db.execute(
      `INSERT INTO transactions (id, date, amount, type, account_id, category_id, note, transfer_group_id, recurring_rule_id, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, 'transfer', ?, NULL, ?, ?, NULL, ?, ?, NULL);`,
      [toId, input.date, absAmount, input.toAccountId, input.note ?? "", transferGroupId, now, now]
    );

    const fromTx = await this.get(fromId);
    const toTx = await this.get(toId);

    if (!fromTx || !toTx) throw new Error("Failed to create atomic transfer transactions.");
    return [fromTx, toTx];
  }

  async update(id: ID, patch: Partial<NewTransaction>): Promise<Transaction> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found.`);
    }

    const now = nowISO();
    const date = patch.date ?? existing.date;
    const amount = patch.amount !== undefined ? patch.amount : existing.amount;
    const type = patch.type ?? existing.type;
    const accountId = patch.accountId ?? existing.accountId;
    const categoryId =
      type === "transfer"
        ? null
        : patch.categoryId !== undefined
          ? patch.categoryId
          : existing.categoryId;
    const note = patch.note !== undefined ? patch.note : existing.note;

    await this.db.execute(
      `UPDATE transactions
       SET date = ?, amount = ?, type = ?, account_id = ?, category_id = ?, note = ?, updated_at = ?
       WHERE id = ?;`,
      [date, amount, type, accountId, categoryId, note, now, id]
    );

    // If part of a transfer group, keep the paired transaction in sync (amount with opposite sign, date, note)
    if (existing.transferGroupId) {
      const pairedRows = await this.db.select<TransactionRow[]>(
        "SELECT * FROM transactions WHERE transfer_group_id = ? AND id != ? AND deleted_at IS NULL;",
        [existing.transferGroupId, id]
      );
      const paired = pairedRows[0];
      if (paired) {
        const pairedAmount = patch.amount !== undefined ? -patch.amount : paired.amount;
        const pairedDate = patch.date !== undefined ? patch.date : paired.date;
        const pairedNote = patch.note !== undefined ? patch.note : paired.note;

        await this.db.execute(
          `UPDATE transactions
           SET date = ?, amount = ?, note = ?, updated_at = ?
           WHERE id = ?;`,
          [pairedDate, pairedAmount, pairedNote, now, paired.id]
        );
      }
    }

    const updated = await this.get(id);
    if (!updated) throw new Error("Failed to update transaction.");
    return updated;
  }

  async softDelete(id: ID): Promise<void> {
    const rows = await this.db.select<TransactionRow[]>(
      "SELECT transfer_group_id FROM transactions WHERE id = ?;",
      [id]
    );
    const existing = rows[0];
    if (!existing) return;

    const now = nowISO();

    if (existing.transfer_group_id) {
      // Soft-delete both linked transfer records
      await this.db.execute(
        "UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE transfer_group_id = ?;",
        [now, now, existing.transfer_group_id]
      );
    } else {
      await this.db.execute(
        "UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?;",
        [now, now, id]
      );
    }
  }

  async restore(id: ID): Promise<void> {
    const rows = await this.db.select<TransactionRow[]>(
      "SELECT transfer_group_id FROM transactions WHERE id = ?;",
      [id]
    );
    const existing = rows[0];
    if (!existing) return;

    const now = nowISO();

    if (existing.transfer_group_id) {
      await this.db.execute(
        "UPDATE transactions SET deleted_at = NULL, updated_at = ? WHERE transfer_group_id = ?;",
        [now, existing.transfer_group_id]
      );
    } else {
      await this.db.execute(
        "UPDATE transactions SET deleted_at = NULL, updated_at = ? WHERE id = ?;",
        [now, id]
      );
    }
  }
}

export class SqliteAccountRepository implements AccountRepository {
  constructor(private db: SqlDatabase) {}

  async list(opts?: { includeArchived?: boolean }): Promise<Account[]> {
    let sql = "SELECT * FROM accounts WHERE deleted_at IS NULL";
    if (!opts?.includeArchived) {
      sql += " AND archived = 0";
    }
    sql += " ORDER BY sort_order ASC, name ASC;";

    const rows = await this.db.select<AccountRow[]>(sql);
    return rows.map(mapAccount);
  }

  async get(id: ID): Promise<Account | null> {
    const rows = await this.db.select<AccountRow[]>(
      "SELECT * FROM accounts WHERE id = ? AND deleted_at IS NULL;",
      [id]
    );
    const row = rows[0];
    return row ? mapAccount(row) : null;
  }

  async create(input: NewAccount): Promise<Account> {
    const id = generateId();
    const now = nowISO();

    await this.db.execute(
      `INSERT INTO accounts (id, name, type, initial_balance, color, icon, archived, sort_order, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL);`,
      [
        id,
        input.name,
        input.type,
        input.initialBalance ?? 0,
        input.color ?? "#64748b",
        input.icon ?? "wallet",
        input.archived ? 1 : 0,
        input.sortOrder ?? 0,
        now,
        now,
      ]
    );

    const acc = await this.get(id);
    if (!acc) throw new Error("Failed to create account.");
    return acc;
  }

  async update(id: ID, patch: Partial<NewAccount>): Promise<Account> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Account ${id} not found.`);

    const now = nowISO();
    const name = patch.name ?? existing.name;
    const type = patch.type ?? existing.type;
    const initialBalance =
      patch.initialBalance !== undefined ? patch.initialBalance : existing.initialBalance;
    const color = patch.color ?? existing.color;
    const icon = patch.icon ?? existing.icon;
    const archived = patch.archived !== undefined ? (patch.archived ? 1 : 0) : existing.archived ? 1 : 0;
    const sortOrder = patch.sortOrder !== undefined ? patch.sortOrder : existing.sortOrder;

    await this.db.execute(
      `UPDATE accounts
       SET name = ?, type = ?, initial_balance = ?, color = ?, icon = ?, archived = ?, sort_order = ?, updated_at = ?
       WHERE id = ?;`,
      [name, type, initialBalance, color, icon, archived, sortOrder, now, id]
    );

    const updated = await this.get(id);
    if (!updated) throw new Error("Failed to update account.");
    return updated;
  }

  async softDelete(id: ID): Promise<void> {
    const now = nowISO();
    await this.db.execute(
      "UPDATE accounts SET deleted_at = ?, updated_at = ? WHERE id = ?;",
      [now, now, id]
    );
  }

  async balances(): Promise<Record<ID, Money>> {
    // Calculates: initial_balance + SUM(amount) where deleted_at IS NULL
    const rows = await this.db.select<{ id: string; balance: number }[]>(
      `SELECT a.id, a.initial_balance + COALESCE(SUM(t.amount), 0) AS balance
       FROM accounts a
       LEFT JOIN transactions t ON t.account_id = a.id AND t.deleted_at IS NULL
       WHERE a.deleted_at IS NULL
       GROUP BY a.id;`
    );

    const result: Record<ID, Money> = {};
    for (const row of rows) {
      result[row.id] = row.balance;
    }
    return result;
  }
}

export class SqliteCategoryRepository implements CategoryRepository {
  constructor(private db: SqlDatabase) {}

  async list(kind?: CategoryKind): Promise<Category[]> {
    let sql = "SELECT * FROM categories WHERE deleted_at IS NULL";
    const params: unknown[] = [];
    if (kind) {
      sql += " AND kind = ?";
      params.push(kind);
    }
    sql += " ORDER BY sort_order ASC, name ASC;";

    const rows = await this.db.select<CategoryRow[]>(sql, params);
    return rows.map(mapCategory);
  }

  async get(id: ID): Promise<Category | null> {
    const rows = await this.db.select<CategoryRow[]>(
      "SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL;",
      [id]
    );
    const row = rows[0];
    return row ? mapCategory(row) : null;
  }

  async create(input: NewCategory): Promise<Category> {
    const id = generateId();
    const now = nowISO();

    await this.db.execute(
      `INSERT INTO categories (id, name, kind, color, icon, sort_order, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL);`,
      [
        id,
        input.name,
        input.kind,
        input.color ?? "#64748b",
        input.icon ?? "tag",
        input.sortOrder ?? 0,
        now,
        now,
      ]
    );

    const cat = await this.get(id);
    if (!cat) throw new Error("Failed to create category.");
    return cat;
  }

  async update(id: ID, patch: Partial<NewCategory>): Promise<Category> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Category ${id} not found.`);

    const now = nowISO();
    const name = patch.name ?? existing.name;
    const kind = patch.kind ?? existing.kind;
    const color = patch.color ?? existing.color;
    const icon = patch.icon ?? existing.icon;
    const sortOrder = patch.sortOrder !== undefined ? patch.sortOrder : existing.sortOrder;

    await this.db.execute(
      `UPDATE categories
       SET name = ?, kind = ?, color = ?, icon = ?, sort_order = ?, updated_at = ?
       WHERE id = ?;`,
      [name, kind, color, icon, sortOrder, now, id]
    );

    const updated = await this.get(id);
    if (!updated) throw new Error("Failed to update category.");
    return updated;
  }

  async softDelete(id: ID): Promise<void> {
    const now = nowISO();
    await this.db.execute(
      "UPDATE categories SET deleted_at = ?, updated_at = ? WHERE id = ?;",
      [now, now, id]
    );
  }
}

export class SqliteBudgetRepository implements BudgetRepository {
  constructor(private db: SqlDatabase) {}

  async listByMonth(month: string): Promise<Budget[]> {
    const rows = await this.db.select<BudgetRow[]>(
      `SELECT * FROM budgets WHERE month = ? AND deleted_at IS NULL;`,
      [month]
    );
    return rows.map(mapBudget);
  }

  async upsert(categoryId: ID, month: string, limit: Money): Promise<Budget> {
    const existingRows = await this.db.select<BudgetRow[]>(
      `SELECT * FROM budgets WHERE category_id = ? AND month = ? AND deleted_at IS NULL;`,
      [categoryId, month]
    );
    const existing = existingRows[0];
    const now = nowISO();

    if (existing) {
      await this.db.execute(
        `UPDATE budgets SET "limit" = ?, updated_at = ? WHERE id = ?;`,
        [limit, now, existing.id]
      );
      return {
        ...mapBudget(existing),
        limit,
        updatedAt: now,
      };
    }

    const id = generateId();
    await this.db.execute(
      `INSERT INTO budgets (id, category_id, month, "limit", created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL);`,
      [id, categoryId, month, limit, now, now]
    );

    return {
      id,
      categoryId,
      month,
      limit,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  }

  async copyMonth(fromMonth: string, toMonth: string): Promise<void> {
    const source = await this.listByMonth(fromMonth);
    for (const b of source) {
      await this.upsert(b.categoryId, toMonth, b.limit);
    }
  }

  async softDelete(id: ID): Promise<void> {
    const now = nowISO();
    await this.db.execute(
      "UPDATE budgets SET deleted_at = ?, updated_at = ? WHERE id = ?;",
      [now, now, id]
    );
  }
}

export class SqliteRecurringRepository implements RecurringRepository {
  constructor(private db: SqlDatabase) {}

  async list(activeOnly?: boolean): Promise<RecurringRule[]> {
    let sql = "SELECT * FROM recurring_rules WHERE deleted_at IS NULL";
    if (activeOnly) {
      sql += " AND active = 1";
    }
    sql += " ORDER BY created_at DESC;";

    const rows = await this.db.select<RecurringRuleRow[]>(sql);
    return rows.map(mapRecurring);
  }

  async get(id: ID): Promise<RecurringRule | null> {
    const rows = await this.db.select<RecurringRuleRow[]>(
      "SELECT * FROM recurring_rules WHERE id = ? AND deleted_at IS NULL;",
      [id]
    );
    const row = rows[0];
    return row ? mapRecurring(row) : null;
  }

  async create(input: NewRecurringRule): Promise<RecurringRule> {
    const id = generateId();
    const now = nowISO();
    const active = input.active !== undefined ? (input.active ? 1 : 0) : 1;

    await this.db.execute(
      `INSERT INTO recurring_rules (id, name, type, amount, account_id, category_id, note, frequency, interval, start_date, end_date, last_generated_date, active, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL);`,
      [
        id,
        input.name,
        input.type,
        input.amount,
        input.accountId,
        input.categoryId,
        input.note ?? "",
        input.frequency,
        input.interval ?? 1,
        input.startDate,
        input.endDate ?? null,
        active,
        now,
        now,
      ]
    );

    const created = await this.get(id);
    if (!created) throw new Error("Failed to create recurring rule.");
    return created;
  }

  async update(id: ID, patch: Partial<NewRecurringRule>): Promise<RecurringRule> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Recurring rule ${id} not found.`);

    const now = nowISO();
    const name = patch.name ?? existing.name;
    const type = patch.type ?? existing.type;
    const amount = patch.amount !== undefined ? patch.amount : existing.amount;
    const accountId = patch.accountId ?? existing.accountId;
    const categoryId = patch.categoryId ?? existing.categoryId;
    const note = patch.note !== undefined ? patch.note : existing.note;
    const frequency = patch.frequency ?? existing.frequency;
    const interval = patch.interval !== undefined ? patch.interval : existing.interval;
    const startDate = patch.startDate ?? existing.startDate;
    const endDate = patch.endDate !== undefined ? patch.endDate : existing.endDate;
    const active = patch.active !== undefined ? (patch.active ? 1 : 0) : (existing.active ? 1 : 0);

    await this.db.execute(
      `UPDATE recurring_rules
       SET name = ?, type = ?, amount = ?, account_id = ?, category_id = ?, note = ?, frequency = ?, interval = ?, start_date = ?, end_date = ?, active = ?, updated_at = ?
       WHERE id = ?;`,
      [name, type, amount, accountId, categoryId, note, frequency, interval, startDate, endDate, active, now, id]
    );

    const updated = await this.get(id);
    if (!updated) throw new Error("Failed to update recurring rule.");
    return updated;
  }

  async softDelete(id: ID): Promise<void> {
    const now = nowISO();
    await this.db.execute(
      "UPDATE recurring_rules SET deleted_at = ?, updated_at = ? WHERE id = ?;",
      [now, now, id]
    );
  }

  async markGenerated(id: ID, date: DateOnly): Promise<void> {
    const now = nowISO();
    await this.db.execute(
      "UPDATE recurring_rules SET last_generated_date = ?, updated_at = ? WHERE id = ?;",
      [date, now, id]
    );
  }
}

export class SqliteGoalRepository implements GoalRepository {
  constructor(private db: SqlDatabase) {}

  async list(): Promise<Goal[]> {
    const rows = await this.db.select<GoalRow[]>(
      "SELECT * FROM goals WHERE deleted_at IS NULL ORDER BY created_at DESC;"
    );
    return rows.map(mapGoal);
  }

  async get(id: ID): Promise<Goal | null> {
    const rows = await this.db.select<GoalRow[]>(
      "SELECT * FROM goals WHERE id = ? AND deleted_at IS NULL;",
      [id]
    );
    const row = rows[0];
    return row ? mapGoal(row) : null;
  }

  async create(input: NewGoal): Promise<Goal> {
    const id = generateId();
    const now = nowISO();

    await this.db.execute(
      `INSERT INTO goals (id, name, target_amount, saved_amount, target_date, account_id, color, icon, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL);`,
      [
        id,
        input.name,
        input.targetAmount,
        input.savedAmount ?? 0,
        input.targetDate ?? null,
        input.accountId ?? null,
        input.color ?? "#22c55e",
        input.icon ?? "target",
        now,
        now,
      ]
    );

    const created = await this.get(id);
    if (!created) throw new Error("Failed to create goal.");
    return created;
  }

  async update(id: ID, patch: Partial<NewGoal>): Promise<Goal> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Goal ${id} not found.`);

    const now = nowISO();
    const name = patch.name ?? existing.name;
    const targetAmount =
      patch.targetAmount !== undefined ? patch.targetAmount : existing.targetAmount;
    const savedAmount =
      patch.savedAmount !== undefined ? patch.savedAmount : existing.savedAmount;
    const targetDate =
      patch.targetDate !== undefined ? patch.targetDate : existing.targetDate;
    const accountId =
      patch.accountId !== undefined ? patch.accountId : existing.accountId;
    const color = patch.color ?? existing.color;
    const icon = patch.icon ?? existing.icon;

    await this.db.execute(
      `UPDATE goals
       SET name = ?, target_amount = ?, saved_amount = ?, target_date = ?, account_id = ?, color = ?, icon = ?, updated_at = ?
       WHERE id = ?;`,
      [name, targetAmount, savedAmount, targetDate, accountId, color, icon, now, id]
    );

    const updated = await this.get(id);
    if (!updated) throw new Error("Failed to update goal.");
    return updated;
  }

  async addSaving(id: ID, amount: Money): Promise<Goal> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Goal ${id} not found.`);

    const now = nowISO();
    const newSaved = existing.savedAmount + amount;

    await this.db.execute(
      "UPDATE goals SET saved_amount = ?, updated_at = ? WHERE id = ?;",
      [newSaved, now, id]
    );

    const updated = await this.get(id);
    if (!updated) throw new Error("Failed to update goal saved amount.");
    return updated;
  }

  async softDelete(id: ID): Promise<void> {
    const now = nowISO();
    await this.db.execute(
      "UPDATE goals SET deleted_at = ?, updated_at = ? WHERE id = ?;",
      [now, now, id]
    );
  }
}

export class SqliteSettingsRepository implements SettingsRepository {
  constructor(private db: SqlDatabase) {}

  async get(key: string): Promise<string | null> {
    const rows = await this.db.select<{ value: string }[]>(
      "SELECT value FROM app_settings WHERE key = ?;",
      [key]
    );
    return rows[0]?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.execute(
      "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);",
      [key, value]
    );
  }
}

export function createSqliteRepositories(db: SqlDatabase): Repositories {
  return {
    transactions: new SqliteTransactionRepository(db),
    accounts: new SqliteAccountRepository(db),
    categories: new SqliteCategoryRepository(db),
    budgets: new SqliteBudgetRepository(db),
    recurring: new SqliteRecurringRepository(db),
    goals: new SqliteGoalRepository(db),
    settings: new SqliteSettingsRepository(db),
  };
}
