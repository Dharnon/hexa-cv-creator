import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';

export function createHrRoutes(db: DatabaseSync): Router {
  const router = Router();

  router.get('/employees', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT p.user_id, p.full_name, p.email, c.data, c.updated_at as cv_updated_at
         FROM profiles p
         LEFT JOIN cv_data c ON c.user_id = p.user_id
         ORDER BY p.full_name COLLATE NOCASE`,
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
