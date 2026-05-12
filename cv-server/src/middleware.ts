import type { NextFunction, Request, Response } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { verifyToken } from './auth';
import type { AppRole } from './db';

export interface AuthedRequest extends Request {
  userId?: string;
  email?: string;
}

export function authMiddleware(db: DatabaseSync, jwtSecret: string) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const payload = verifyToken(token, jwtSecret);
      req.userId = payload.sub;
      req.email = payload.email;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}

export function requireRole(db: DatabaseSync, roles: AppRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const uid = req.userId;
    if (!uid) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const rows = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(uid) as { role: AppRole }[];
    const userRoles = rows.map((r) => r.role);
    const ok = roles.some((r) => userRoles.includes(r));
    if (!ok) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
