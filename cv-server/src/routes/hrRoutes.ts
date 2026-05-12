import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import type { AuthedRequest } from '../middleware';

export function createHrRoutes(db: DatabaseSync): Router {
  const router = Router();

  router.patch('/employees/:userId/role', (req: AuthedRequest, res) => {
    const { userId } = req.params;
    const { role } = req.body ?? {};
    if (role !== 'lead' && role !== 'member') {
      res.status(400).json({ error: 'role debe ser "lead" o "member"' });
      return;
    }

    const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!userExists) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const row = db
      .prepare('SELECT data FROM cv_data WHERE user_id = ?')
      .get(userId) as { data: string } | undefined;

    let cv: Record<string, unknown> = {};
    if (row?.data) {
      try {
        cv = JSON.parse(row.data) as Record<string, unknown>;
      } catch {
        cv = {};
      }
    }
    cv.role = role;
    const json = JSON.stringify(cv);

    if (row) {
      db.prepare(
        `UPDATE cv_data SET data = ?, updated_at = datetime('now') WHERE user_id = ?`,
      ).run(json, userId);
    } else {
      db.prepare(
        `INSERT INTO cv_data (user_id, data, updated_at) VALUES (?, ?, datetime('now'))`,
      ).run(userId, json);
    }

    res.json({ ok: true, role });
  });

  router.get('/employees', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT u.id AS user_id,
                COALESCE(NULLIF(TRIM(p.full_name), ''), u.email) AS full_name,
                COALESCE(NULLIF(TRIM(p.email), ''), u.email) AS email,
                c.data, c.updated_at AS cv_updated_at
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         LEFT JOIN cv_data c ON c.user_id = u.id
         ORDER BY full_name COLLATE NOCASE`,
      )
      .all() as {
      user_id: string;
      full_name: string;
      email: string;
      data: string | null;
      cv_updated_at: string | null;
    }[];

    const result = rows.map((r) => {
      let parsed: unknown = null;
      if (r.data) {
        try {
          parsed = JSON.parse(r.data);
        } catch {
          parsed = null;
        }
      }
      return {
        user_id: r.user_id,
        full_name: r.full_name || r.email,
        email: r.email,
        data: parsed,
        updated_at: r.cv_updated_at ?? '',
      };
    });

    res.json(result);
  });

  return router;
}
