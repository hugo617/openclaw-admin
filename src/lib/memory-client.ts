import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { OPENCLAW_HOME } from "./openclaw";

export interface MemoryEntry {
  id: string;
  text: string;
  path: string;
  source: string;
  model: string;
  startLine: number;
  endLine: number;
  updatedAt: string;
}

export interface MemorySearchResult extends MemoryEntry {
  rank: number;
}

export interface MemoryStats {
  totalChunks: number;
  totalFiles: number;
  dbSize: number;
  bySource: Record<string, number>;
  byModel: Record<string, number>;
}

export interface FileEntry {
  path: string;
  source: string;
  hash: string;
  mtime: number;
  size: number;
}

function getDbPath(): string {
  return path.join(OPENCLAW_HOME, "memory", "main.sqlite");
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

function rowToEntry(row: Record<string, unknown>): MemoryEntry {
  return {
    id: row.id as string,
    text: row.text as string,
    path: row.path as string,
    source: row.source as string,
    model: row.model as string,
    startLine: row.start_line as number,
    endLine: row.end_line as number,
    updatedAt: new Date((row.updated_at as number) * 1000).toISOString(),
  };
}

export function searchMemory(query: string, limit = 20): MemorySearchResult[] {
  const db = openDb();
  try {
    const rows = db
      .prepare(
        `SELECT c.id, c.text, c.path, c.source, c.model, c.start_line, c.end_line, c.updated_at, fts.rank
         FROM chunks_fts fts
         JOIN chunks c ON c.id = fts.id
         WHERE chunks_fts MATCH ?
         ORDER BY fts.rank
         LIMIT ?`
      )
      .all(query, limit) as Array<Record<string, unknown> & { rank: number }>;

    return rows.map((row) => ({
      ...rowToEntry(row),
      rank: row.rank,
    }));
  } finally {
    db.close();
  }
}

export function searchMemoryLike(query: string, limit = 20): MemorySearchResult[] {
  const db = openDb();
  try {
    const rows = db
      .prepare(
        `SELECT id, text, path, source, model, start_line, end_line, updated_at
         FROM chunks
         WHERE text LIKE ?
         ORDER BY updated_at DESC
         LIMIT ?`
      )
      .all(`%${query}%`, limit) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      ...rowToEntry(row),
      rank: 0,
    }));
  } finally {
    db.close();
  }
}

export function getMemoryStats(): MemoryStats {
  const dbPath = getDbPath();
  const db = openDb();

  try {
    const chunkCount = (db.prepare("SELECT COUNT(*) as count FROM chunks").get() as { count: number }).count;
    const fileCount = (db.prepare("SELECT COUNT(*) as count FROM files").get() as { count: number }).count;

    const bySourceRows = db
      .prepare("SELECT source, COUNT(*) as count FROM chunks GROUP BY source")
      .all() as Array<{ source: string; count: number }>;

    const byModelRows = db
      .prepare("SELECT model, COUNT(*) as count FROM chunks GROUP BY model")
      .all() as Array<{ model: string; count: number }>;

    const stat = fs.statSync(dbPath);

    return {
      totalChunks: chunkCount,
      totalFiles: fileCount,
      dbSize: stat.size,
      bySource: Object.fromEntries(bySourceRows.map((r) => [r.source, r.count])),
      byModel: Object.fromEntries(byModelRows.map((r) => [r.model, r.count])),
    };
  } finally {
    db.close();
  }
}

export function getRecentMemories(limit = 50): MemoryEntry[] {
  const db = openDb();
  try {
    const rows = db
      .prepare(
        `SELECT id, text, path, source, model, start_line, end_line, updated_at
         FROM chunks
         ORDER BY updated_at DESC
         LIMIT ?`
      )
      .all(limit) as Array<Record<string, unknown>>;

    return rows.map(rowToEntry);
  } finally {
    db.close();
  }
}

export function getMemoriesByPath(limit = 100): Record<string, MemoryEntry[]> {
  const db = openDb();
  try {
    const rows = db
      .prepare(
        `SELECT id, text, path, source, model, start_line, end_line, updated_at
         FROM chunks
         ORDER BY path, start_line
         LIMIT ?`
      )
      .all(limit) as Array<Record<string, unknown>>;

    const grouped: Record<string, MemoryEntry[]> = {};
    for (const row of rows) {
      const entry = rowToEntry(row);
      if (!grouped[entry.path]) {
        grouped[entry.path] = [];
      }
      grouped[entry.path].push(entry);
    }
    return grouped;
  } finally {
    db.close();
  }
}

export function getFiles(): FileEntry[] {
  const db = openDb();
  try {
    const rows = db
      .prepare("SELECT path, source, hash, mtime, size FROM files ORDER BY path")
      .all() as Array<FileEntry>;
    return rows;
  } finally {
    db.close();
  }
}
