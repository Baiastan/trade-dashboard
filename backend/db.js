import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDir = path.resolve("backend/data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "trade-dashboard.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function readJsonState(key, fallback) {
  const row = db.prepare("SELECT value FROM app_state WHERE key = ?").get(key);
  if (!row?.value) return fallback;

  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

function writeJsonState(key, value) {
  db.prepare(`
    INSERT INTO app_state (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = datetime('now')
  `).run(key, JSON.stringify(value ?? null));
}

export { db, readJsonState, writeJsonState };
