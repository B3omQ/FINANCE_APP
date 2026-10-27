import Database from "@tauri-apps/plugin-sql";
import { ALL_DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from "./seed";
import { generateId } from "@/shared/lib/uuid";
import { nowISO } from "@/shared/lib/date";

export interface SqlDatabase {
  execute(
    query: string,
    bindValues?: unknown[]
  ): Promise<{ rowsAffected: number; lastInsertId?: number }>;
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
}

export const INIT_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash','bank','ewallet','other')),
  initial_balance INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#64748b',
  icon TEXT NOT NULL DEFAULT 'wallet',
  archived INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income','expense')),
  color TEXT NOT NULL DEFAULT '#64748b',
  icon TEXT NOT NULL DEFAULT 'tag',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS recurring_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  category_id TEXT NOT NULL REFERENCES categories(id),
  note TEXT NOT NULL DEFAULT '',
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','yearly')),
  interval INTEGER NOT NULL DEFAULT 1 CHECK (interval >= 1),
  start_date TEXT NOT NULL,
  end_date TEXT,
  last_generated_date TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  category_id TEXT REFERENCES categories(id),
  note TEXT NOT NULL DEFAULT '',
  transfer_group_id TEXT,
  recurring_rule_id TEXT REFERENCES recurring_rules(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(account_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tx_transfer ON transactions(transfer_group_id);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  month TEXT NOT NULL,
  "limit" INTEGER NOT NULL CHECK ("limit" >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_unique ON budgets(category_id, month) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount INTEGER NOT NULL CHECK (target_amount > 0),
  saved_amount INTEGER NOT NULL DEFAULT 0,
  target_date TEXT,
  account_id TEXT REFERENCES accounts(id),
  color TEXT NOT NULL DEFAULT '#22c55e',
  icon TEXT NOT NULL DEFAULT 'target',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

/**
 * Executes a multiline SQL script statement by statement.
 */
export async function executeSqlScript(db: SqlDatabase, sqlScript: string): Promise<void> {
  const statements = sqlScript
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await db.execute(statement);
  }
}

/**
 * Initializes database schema and seeds default data once.
 */
export async function initializeDatabase(db: SqlDatabase): Promise<void> {
  // 1. Run migrations
  await executeSqlScript(db, INIT_MIGRATION_SQL);

  // 2. Check if already seeded
  const seededRows = await db.select<{ value: string }[]>(
    "SELECT value FROM app_settings WHERE key = 'seeded';"
  );

  if (seededRows.length > 0 && seededRows[0]?.value === "1") {
    // Already seeded, skip
    return;
  }

  // 3. Seed initial default account
  const now = nowISO();
  for (const acc of DEFAULT_ACCOUNTS) {
    const id = generateId();
    await db.execute(
      `INSERT INTO accounts (id, name, type, initial_balance, color, icon, archived, sort_order, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL);`,
      [
        id,
        acc.name,
        acc.type,
        acc.initialBalance ?? 0,
        acc.color ?? "#22c55e",
        acc.icon ?? "wallet",
        acc.archived ? 1 : 0,
        acc.sortOrder ?? 0,
        now,
        now,
      ]
    );
  }

  // 4. Seed default categories
  for (const cat of ALL_DEFAULT_CATEGORIES) {
    const id = generateId();
    await db.execute(
      `INSERT INTO categories (id, name, kind, color, icon, sort_order, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL);`,
      [
        id,
        cat.name,
        cat.kind,
        cat.color ?? "#64748b",
        cat.icon ?? "tag",
        cat.sortOrder ?? 0,
        now,
        now,
      ]
    );
  }

  // 5. Mark as seeded
  await db.execute(
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('seeded', '1');"
  );
}

let tauriDbInstance: SqlDatabase | null = null;

/**
 * Gets or loads the SQLite database handle via Tauri plugin.
 */
export async function getTauriSqlDatabase(dbName = "sqlite:finance.db"): Promise<SqlDatabase> {
  if (!tauriDbInstance) {
    const tauriDb = await Database.load(dbName);
    tauriDbInstance = {
      execute: async (query, bindValues) => {
        const res = await tauriDb.execute(query, bindValues as unknown[]);
        return { rowsAffected: res.rowsAffected, lastInsertId: res.lastInsertId };
      },
      select: async <T>(query: string, bindValues?: unknown[]) => {
        return (await tauriDb.select(query, bindValues as unknown[])) as T;
      },
    };
    await initializeDatabase(tauriDbInstance);
  }
  return tauriDbInstance;
}
