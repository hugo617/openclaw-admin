import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { OPENCLAW_HOME } from "./openclaw";

export interface MemorySearchResult {
  id: number;
  content: string;
  metadata: string;
  score: number;
}

function getDbPath(): string {
  return path.join(OPENCLAW_HOME, "memory", "memory.db");
}

export function isMemoryDbAvailable(): boolean {
  try {
    return fs.existsSync(getDbPath());
  } catch {
    return false;
  }
}

function openDb(): Database.Database {
  return new Database(getDbPath(), { readonly: true });
}

function detectTableName(db: Database.Database): string {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    .all() as Array<{ name: string }>;

  if (tables.length === 0) {
    throw new Error("No tables found in memory database");
  }

  // Prefer known names
  const candidates = ["memories", "memory", "embeddings", "documents", "entries"];
  for (const c of candidates) {
    if (tables.some((t) => t.name === c)) return c;
  }

  // Fallback: use first table (safe: name comes from sqlite_master, not user input)
  return tables[0].name;
}

export function searchMemory(query: string, limit = 20): MemorySearchResult[] {
  const db = openDb();
  try {
    const table = detectTableName(db);
    const stmt = db.prepare(
      `SELECT rowid as id, content, metadata FROM ${table} WHERE content LIKE ? ORDER BY rowid DESC LIMIT ?`
    );
    const rows = stmt.all(`%${query}%`, limit) as Array<{
      id: number;
      content: string;
      metadata: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      content: row.content ?? "",
      metadata: row.metadata ?? "",
      score: 1,
    }));
  } finally {
    db.close();
  }
}

export function getMemoryStats(): {
  totalEntries: number;
  dbSize: number;
} {
  const dbPath = getDbPath();
  const db = openDb();

  try {
    const table = detectTableName(db);
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as {
      count: number;
    };
    const stat = fs.statSync(dbPath);

    return {
      totalEntries: row.count,
      dbSize: stat.size,
    };
  } finally {
    db.close();
  }
}

export function getRecentMemories(limit = 50): MemorySearchResult[] {
  const db = openDb();
  try {
    const table = detectTableName(db);
    const rows = db
      .prepare(
        `SELECT rowid as id, content, metadata FROM ${table} ORDER BY rowid DESC LIMIT ?`
      )
      .all(limit) as Array<{
      id: number;
      content: string;
      metadata: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      content: row.content ?? "",
      metadata: row.metadata ?? "",
      score: 1,
    }));
  } finally {
    db.close();
  }
}
