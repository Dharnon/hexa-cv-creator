import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import type { AuthedRequest } from '../middleware';

export function createCvRoutes(db: DatabaseSync): Router {
  const router = Router();

  router.get('/', (req: AuthedRequest, res) => {
    const uid = req.userId!;
    const row = db
      .prepare(`SELECT data, updated_at FROM cv_data WHERE user_id = ?`)
      .get(uid) as { data: string; updated_at: string } | undefined;

    if (!row) {
      res.json({ data: {}, updated_at: null });
      return;
    }

    let parsed: unknown = {};
    try {
      parsed = JSON.parse(row.data);
    } catch {
      parsed = {};
    }

    res.json({ data: parsed, updated_at: row.updated_at });
  });

  router.put('/', (req: AuthedRequest, res) => {
    const uid = req.userId!;
    const data = req.body?.data;
    if (data === undefined || typeof data !== 'object' || data === null) {
      res.status(400).json({ error: 'Body debe incluir objeto data' });
      return;
    }

    const json = JSON.stringify(data);
    const existing = db.prepare(`SELECT user_id FROM cv_data WHERE user_id = ?`).get(uid);

    if (existing) {
      db.prepare(`UPDATE cv_data SET data = ?, updated_at = datetime('now') WHERE user_id = ?`).run(
        json,
        uid,
      );
    } else {
      db.prepare(`INSERT INTO cv_data (user_id, data, updated_at) VALUES (?, ?, datetime('now'))`).run(
        uid,
        json,
      );
    }

    res.json({ ok: true });
  });

  return router;
}
