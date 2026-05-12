import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import type { AppRole } from '../db';

const VALID_ROLES: AppRole[] = ['admin', 'hr', 'employee'];

export function createAdminRoutes(db: DatabaseSync): Router {
  const router = Router();

  router.get('/users', (_req, res) => {
    const profiles = db.prepare(`SELECT user_id, full_name, email FROM profiles`).all() as {
      user_id: string;
      full_name: string;
      email: string;
    }[];

    const roleRows = db.prepare(`SELECT user_id, role FROM user_roles`).all() as {
      user_id: string;
      role: AppRole;
    }[];

    const roleMap = new Map<string, AppRole[]>();
    roleRows.forEach((r) => {
      const list = roleMap.get(r.user_id) ?? [];
      list.push(r.role);
      roleMap.set(r.user_id, list);
    });

    res.json(
      profiles.map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name || p.email,
        email: p.email,
        roles: roleMap.get(p.user_id) ?? [],
      })),
    );
  });

  router.post('/users/:userId/roles', (req, res) => {
    const { userId } = req.params;
    const role = req.body?.role as AppRole | undefined;

    if (!role || !VALID_ROLES.includes(role)) {
      res.status(400).json({ error: 'Rol inválido' });
      return;
    }

    const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    try {
      db.prepare(`INSERT INTO user_roles (user_id, role) VALUES (?, ?)`).run(userId, role);
    } catch {
      res.status(409).json({ error: 'El usuario ya tiene este rol' });
      return;
    }

    res.status(201).json({ ok: true });
  });

  router.delete('/users/:userId/roles/:role', (req, res) => {
    const { userId, role } = req.params;

    if (!VALID_ROLES.includes(role as AppRole)) {
      res.status(400).json({ error: 'Rol inválido' });
      return;
    }

    const exists = db
      .prepare(`SELECT 1 as x FROM user_roles WHERE user_id = ? AND role = ?`)
      .get(userId, role) as { x: number } | undefined;

    if (!exists) {
      res.status(404).json({ error: 'Rol no encontrado' });
      return;
    }

    db.prepare(`DELETE FROM user_roles WHERE user_id = ? AND role = ?`).run(userId, role);

    res.json({ ok: true });
  });

  return router;
}
