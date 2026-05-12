/**
 * Importa usuarios y CVs desde un JSON (p. ej. exportación manual desde Supabase).
 *
 * Política de contraseñas: Supabase no expone hashes reutilizables. Cada usuario
 * importado recibe la contraseña dada en IMPORT_DEFAULT_PASSWORD (por defecto
 * "CambiarAlIniciar1!") o la del campo opcional "password" por fila.
 *
 * Uso (desde la carpeta cv-server, con .env con DATABASE_PATH y JWT_SECRET no usado aquí):
 *   npx tsx scripts/import-users-from-json.ts ruta/al/archivo.json
 *
 * Formato del JSON: array de objetos
 *   {
 *     "email": "user@hexaingenieros.com",
 *     "full_name": "Nombre",
 *     "job_title": "Puesto",
 *     "password": "opcional",
 *     "cv_data": { ... },  // opcional, objeto CV
 *     "roles": ["employee", "hr"]  // opcional, por defecto ["employee"]
 *   }
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { openDatabase } from '../src/db';
import type { AppRole } from '../src/db';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

type Row = {
  email: string;
  full_name: string;
  job_title?: string;
  password?: string;
  cv_data?: unknown;
  roles?: AppRole[];
};

const DEFAULT_PW = process.env.IMPORT_DEFAULT_PASSWORD ?? 'CambiarAlIniciar1!';

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Uso: npx tsx scripts/import-users-from-json.ts <archivo.json>');
    process.exit(1);
  }

  const raw = fs.readFileSync(path.resolve(file), 'utf8');
  const rows = JSON.parse(raw) as Row[];

  const dbPath = process.env.DATABASE_PATH ?? './data/cv.sqlite';
  const db = openDatabase(dbPath);

  for (const row of rows) {
    const email = String(row.email ?? '')
      .trim()
      .toLowerCase();
    if (!email || !row.full_name?.trim()) {
      console.warn('Fila omitida (email o nombre vacío):', row);
      continue;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
    if (existing) {
      console.warn('Ya existe usuario, se omite:', email);
      continue;
    }

    const id = randomUUID();
    const pw = row.password ?? DEFAULT_PW;
    const hash = bcrypt.hashSync(pw, 12);

    db.prepare(`INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`).run(id, email, hash);

    db.prepare(
      `INSERT INTO profiles (user_id, full_name, email, job_title, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
    ).run(id, row.full_name.trim(), email, (row.job_title ?? '').trim());

    const roles: AppRole[] =
      row.roles && row.roles.length > 0 ? row.roles : ['employee'];
    const seen = new Set<AppRole>();
    for (const r of roles) {
      if (!seen.has(r) && ['admin', 'hr', 'employee'].includes(r)) {
        seen.add(r);
        db.prepare(`INSERT INTO user_roles (user_id, role) VALUES (?, ?)`).run(id, r);
      }
    }

    if (row.cv_data !== undefined && row.cv_data !== null) {
      const json = JSON.stringify(row.cv_data);
      db.prepare(`INSERT INTO cv_data (user_id, data, updated_at) VALUES (?, ?, datetime('now'))`).run(
        id,
        json,
      );
    }

    console.log(`Importado: ${email} (id ${id})`);
    if (!row.password) {
      console.log(`  Contraseña por defecto: ${pw}`);
    }
  }

  console.log('Listo.');
}

main();
