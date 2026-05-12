import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import type { AuthedRequest } from '../middleware';
import type { AppRole } from '../db';

function userHasRole(db: DatabaseSync, userId: string, roles: AppRole[]): boolean {
  const rows = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(userId) as {
    role: AppRole;
  }[];
  const userRoles = rows.map((r) => r.role);
  return roles.some((r) => userRoles.includes(r));
}

export function createTenderRoutes(db: DatabaseSync): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const rows = db
      .prepare('SELECT id, label, updated_at FROM tenders ORDER BY label COLLATE NOCASE')
      .all() as { id: string; label: string; updated_at: string }[];
    res.json(rows);
  });

  router.post('/', (req: AuthedRequest, res) => {
    const uid = req.userId!;
    if (!userHasRole(db, uid, ['hr', 'admin'])) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const label = typeof req.body?.label === 'string' ? req.body.label.trim() : '';
    if (!label) {
      res.status(400).json({ error: 'label es obligatorio' });
      return;
    }
    const id = randomUUID();
    db.prepare('INSERT INTO tenders (id, label) VALUES (?, ?)').run(id, label);
    res.status(201).json({ id, label });
  });

  router.delete('/:id', (req: AuthedRequest, res) => {
    const uid = req.userId!;
    if (!userHasRole(db, uid, ['hr', 'admin'])) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const { id } = req.params;
    const result = db.prepare('DELETE FROM tenders WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'No encontrado' });
      return;
    }
    res.json({ ok: true });
  });

  return router;
}
