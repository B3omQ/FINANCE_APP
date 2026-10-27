import initSqlJs from "sql.js";
import type { SqlDatabase } from "./client";
import { initializeDatabase } from "./client";

export async function createTestSqliteDb(): Promise<SqlDatabase> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  const sqlDb: SqlDatabase = {
    async execute(query: string, bindValues?: unknown[]) {
      db.run(query, (bindValues ?? []) as (number | string | null | Uint8Array)[]);
      return { rowsAffected: db.getRowsModified() };
    },
    async select<T>(query: string, bindValues?: unknown[]): Promise<T> {
      const stmt = db.prepare(query);
      stmt.bind((bindValues ?? []) as (number | string | null | Uint8Array)[]);
      const results: Record<string, unknown>[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results as unknown as T;
    },
  };

  await initializeDatabase(sqlDb);
  return sqlDb;
}
