import type { Repositories } from "./repositories/types";
import { createMemoryRepositories } from "./repositories/memory";
import { createSqliteRepositories } from "./repositories/sqlite";
import { getTauriSqlDatabase } from "./db/client";

export * from "./repositories/types";
export { createMemoryRepositories } from "./repositories/memory";
export { createSqliteRepositories } from "./repositories/sqlite";

/**
 * Creates the appropriate repositories instance based on the runtime environment:
 * - Uses SQLite plugin if running in Tauri desktop environment.
 * - Uses in-memory repositories if running in standard browser/dev server or when VITE_USE_MEMORY_REPO=true.
 */
export async function getRepositories(): Promise<Repositories> {
  const forceMemory = import.meta.env.VITE_USE_MEMORY_REPO === "true";

  // Check if running inside Tauri webview
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  if (isTauri && !forceMemory) {
    try {
      const db = await getTauriSqlDatabase();
      return createSqliteRepositories(db);
    } catch (err) {
      console.warn("Failed to connect to Tauri SQLite plugin, falling back to memory repository:", err);
      return createMemoryRepositories({ seed: true });
    }
  }

  return createMemoryRepositories({ seed: true });
}
