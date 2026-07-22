import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";

// Single shared SQLite connection for the app. Ported from the Rust backend in
// src-tauri/src/db.rs — the schema is byte-for-byte the same so an existing
// meals.db would be readable, and query behaviour matches the old commands.

const DB_NAME = "mealplanner";
const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;

/** Same schema as create_schema() in src-tauri/src/db.rs. */
const SCHEMA = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  recipe_url TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS week_plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS shopping_list (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_id INTEGER NOT NULL UNIQUE,
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS shopping_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL UNIQUE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);
`;

/**
 * Opens the connection and ensures the schema exists. Call once before rendering.
 * On web this spins up the jeep-sqlite/wasm store; on device it uses native SQLite.
 */
export async function initDb(): Promise<void> {
  if (db) return;

  if (Capacitor.getPlatform() === "web") {
    // The web build persists to IndexedDB via the jeep-sqlite element (see main.tsx).
    await sqlite.initWebStore();
  }

  const conn = await sqlite.createConnection(
    DB_NAME,
    false,
    "no-encryption",
    1,
    false,
  );
  await conn.open();
  await conn.execute(SCHEMA);
  await migrate(conn);
  db = conn;
}

/**
 * Additive migrations for databases created before a column existed. Each step
 * is guarded so re-running (or a fresh DB that already has the column) is a
 * no-op. `CREATE TABLE IF NOT EXISTS` never alters an existing table, so new
 * columns have to be added here.
 */
async function migrate(conn: SQLiteDBConnection): Promise<void> {
  const info = await conn.query("PRAGMA table_info(meals)");
  const columns = (info.values ?? []).map((c: { name: string }) => c.name);
  if (!columns.includes("recipe_url")) {
    await conn.execute(
      "ALTER TABLE meals ADD COLUMN recipe_url TEXT NOT NULL DEFAULT ''",
    );
  }
}

/** The open connection. Throws if initDb() hasn't run yet. */
export function getDb(): SQLiteDBConnection {
  if (!db) throw new Error("Database not initialized — call initDb() first.");
  return db;
}
