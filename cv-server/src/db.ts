import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

export type AppRole = 'admin' | 'hr' | 'employee';

export type CvDb = DatabaseSync;

export function openDatabase(dbPath: string): DatabaseSync {
  const resolved = path.resolve(dbPath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(resolved);
  db.exec('PRAGMA journal_mode = WAL;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      job_title TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('admin', 'hr', 'employee')),
      UNIQUE (user_id, role)
    );

    CREATE TABLE IF NOT EXISTS cv_data (
      user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tenders (
      id TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Repara filas huérfanas (usuario sin perfil): RRHH y admin listan desde `profiles`.
  db.exec(`
    INSERT INTO profiles (user_id, full_name, email, job_title, updated_at)
    SELECT u.id, '', u.email, '', datetime('now')
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = u.id);
  `);

  return db;
}
