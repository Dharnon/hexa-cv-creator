import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { openDatabase } from './db';
import { authMiddleware, requireRole } from './middleware';
import { createAuthRoutes } from './routes/authRoutes';
import { createCvRoutes } from './routes/cvRoutes';
import { createHrRoutes } from './routes/hrRoutes';
import { createAdminRoutes } from './routes/adminRoutes';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PORT = Number(process.env.PORT ?? 3847);
const DATABASE_PATH = process.env.DATABASE_PATH ?? './data/cv.sqlite';
const JWT_SECRET = process.env.JWT_SECRET ?? '';
const parseCorsOrigins = (): string[] => {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return ['http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:8080', 'http://127.0.0.1:5173'];
  }
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
};

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error('[cv-server] JWT_SECRET must be set and at least 16 characters.');
  process.exit(1);
}

const db = openDatabase(DATABASE_PATH);
const app = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const corsOrigins = parseCorsOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hexa-cv-server' });
});

app.use('/api/auth', createAuthRoutes(db, JWT_SECRET));

const authed = authMiddleware(db, JWT_SECRET);

app.use('/api/cv', authed, createCvRoutes(db));

app.use(
  '/api/hr',
  authed,
  requireRole(db, ['hr', 'admin']),
  createHrRoutes(db),
);

app.use(
  '/api/admin',
  authed,
  requireRole(db, ['admin']),
  createAdminRoutes(db),
);

app.listen(PORT, () => {
  console.log(`[cv-server] listening on http://localhost:${PORT}`);
});
