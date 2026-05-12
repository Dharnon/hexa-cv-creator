/**
 * Asigna roles admin y hr a un usuario existente (por email).
 *
 * Producción (contenedor cv-api ya levantado):
 *   docker compose exec cv-api node scripts/grant-admin.mjs correo@hexaingenieros.com
 *
 * Local (desde carpeta cv-server, con .env y DATABASE_PATH):
 *   node --env-file=.env scripts/grant-admin.mjs correo@hexaingenieros.com
 */
import { DatabaseSync } from 'node:sqlite';

const dbPath = process.env.DATABASE_PATH || '/app/data/cv.sqlite';
const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Uso: node scripts/grant-admin.mjs <correo@hexaingenieros.com>');
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
const row = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
if (!row) {
  console.error('[grant-admin] No existe usuario con email:', email);
  process.exit(1);
}
const id = row.id;
for (const role of ['admin', 'hr']) {
  db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)').run(id, role);
}
console.log('[grant-admin] Roles admin + hr asignados a', email);
