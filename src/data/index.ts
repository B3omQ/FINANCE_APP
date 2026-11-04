import type { Repositories } from "./repositories/types";
import { createMemoryRepositories } from "./repositories/memory";
import { createSqliteRepositories } from "./repositories/sqlite";
import { getTauriSqlDatabase } from "./db/client";

export * from "./repositories/types";
export { createMemoryRepositories } from "./repositories/memory";
export { createSqliteRepositories } from "./repositories/sqlite";

export type DatabaseType = "sqlite" | "memory-persistent";
let activeDatabaseType: DatabaseType = "memory-persistent";

export function getActiveDatabaseType(): DatabaseType {
  return activeDatabaseType;
}

/**
 * Creates the appropriate repositories instance based on the runtime environment:
 * - Uses SQLite plugin if running in Tauri desktop environment.
 * - Uses persistent local storage repositories if running in standard browser/dev server or when VITE_USE_MEMORY_REPO=true.
 */
export async function getRepositories(): Promise<Repositories> {
  const forceMemory = import.meta.env.VITE_USE_MEMORY_REPO === "true";

  // Check if running inside Tauri webview
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  if (isTauri && !forceMemory) {
    try {
      const db = await getTauriSqlDatabase();
      activeDatabaseType = "sqlite";
      console.info("[Database] Connected successfully to Tauri SQLite database (finance.db)");
      return createSqliteRepositories(db);
    } catch (err) {
      activeDatabaseType = "memory-persistent";
      console.error(
        "[Database] Failed to connect to Tauri SQLite plugin, falling back to persistent LocalStorage repository:",
        err
      );
      return createMemoryRepositories({ seed: true, persist: true });
    }
  }

  activeDatabaseType = "memory-persistent";
  console.info(
    "[Database] Running in browser/dev mode: Initialized persistent LocalStorage repository"
  );
  return createMemoryRepositories({ seed: true, persist: true });
}
