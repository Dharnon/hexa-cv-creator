import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { DatabaseSync } from 'node:sqlite';
import { signToken, verifyToken } from '../auth';

const COMPANY_SUFFIX = '@hexaingenieros.com';

function isCompanyEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(COMPANY_SUFFIX);
}

export function createAuthRoutes(db: DatabaseSync, jwtSecret: string): Router {
  const router = Router();

  router.post('/register', (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const fullName = String(req.body?.fullName ?? '').trim();
    const jobTitle = String(req.body?.jobTitle ?? '').trim();

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Email, contraseña y nombre son obligatorios' });
      return;
    }
    if (!isCompanyEmail(email)) {
      res.status(400).json({ error: `Solo se permiten correos ${COMPANY_SUFFIX}` });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'El correo ya está registrado' });
      return;
    }

    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
    const id = randomUUID();
    const passwordHash = bcrypt.hashSync(password, 12);

    db.prepare(
      `INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`,
    ).run(id, email, passwordHash);

    db.prepare(
      `INSERT INTO profiles (user_id, full_name, email, job_title, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
    ).run(id, fullName, email, jobTitle);

    db.prepare(`INSERT INTO user_roles (user_id, role) VALUES (?, 'employee')`).run(id);

    const bootstrap = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    if (bootstrap && email === bootstrap) {
      db.prepare(`INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, 'admin')`).run(id);
      db.prepare(`INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, 'hr')`).run(id);
    }

    if (userCount.c === 0 && process.env.FIRST_USER_IS_ADMIN === 'true') {
      db.prepare(`INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, 'admin')`).run(id);
      db.prepare(`INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, 'hr')`).run(id);
    }

    const token = signToken({ sub: id, email }, jwtSecret);

    const roles = (
      db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(id) as { role: string }[]
    ).map((r) => r.role);

    res.status(201).json({
      token,
      user: { id, email },
      roles,
    });
  });

  router.post('/login', (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son obligatorios' });
      return;
    }

    const row = db
      .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
      .get(email) as { id: string; email: string; password_hash: string } | undefined;

    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    const token = signToken({ sub: row.id, email: row.email }, jwtSecret);

    const roles = (
      db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(row.id) as { role: string }[]
    ).map((r) => r.role);

    res.json({
      token,
      user: { id: row.id, email: row.email },
      roles,
    });
  });

  router.get('/me', (req, res) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const payload = verifyToken(token, jwtSecret);
      const profile = db
        .prepare(
          `SELECT full_name, email, job_title FROM profiles WHERE user_id = ?`,
        )
        .get(payload.sub) as { full_name: string; email: string; job_title: string } | undefined;

      const roles = (
        db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(payload.sub) as {
          role: string;
        }[]
      ).map((r) => r.role);

      res.json({
        user: {
          id: payload.sub,
          email: payload.email,
          full_name: profile?.full_name ?? '',
          job_title: profile?.job_title ?? '',
        },
        roles,
      });
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  return router;
}
