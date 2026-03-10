import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { db } from './db/hanaClient';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3006);
const isProduction = process.env.NODE_ENV === 'production';
const trustProxy = process.env.TRUST_PROXY ?? (isProduction ? 'loopback' : 'false');
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (trustProxy !== 'false') {
  app.set('trust proxy', trustProxy);
}

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (!isProduction || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS policy'));
    },
    methods: ['GET'],
    credentials: false,
  }),
);
app.use(express.json({ limit: '64kb' }));

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please retry later.' },
});

app.use('/api', apiLimiter);
app.use((req, _res, next) => {
  console.log(`[server] ${req.method} ${req.path}`);
  next();
});

app.use('/api', apiRoutes);

app.get('/health', (_req: Request, res: Response) => {
  const hanaError =
    isProduction && !db.isAvailable() ? 'SAP HANA unavailable' : db.getFailureReason();

  res.json({
    status: 'ok',
    service: 'sap-mini-server',
    hanaConfigured: db.isConfigured(),
    hanaAvailable: db.isAvailable(),
    hanaError,
    timestamp: new Date().toISOString(),
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[server] Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    ...(isProduction
      ? {}
      : { details: error instanceof Error ? error.message : String(error) }),
  });
});

app.listen(port, () => {
  console.log(`[server] Listening on http://localhost:${port}`);
});

db.connect().catch((error) => {
  db.markUnavailable(error);
  console.warn('[server] SAP HANA connection unavailable. Server started in degraded mode.');
});
