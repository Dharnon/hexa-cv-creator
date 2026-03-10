import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';

import { db } from './db/hanaClient';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3006);

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`[server] ${req.method} ${req.path}`);
  next();
});

app.use('/api', apiRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'sap-mini-server',
    hanaConfigured: db.isConfigured(),
    hanaAvailable: db.isAvailable(),
    hanaError: db.getFailureReason(),
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`[server] Listening on http://localhost:${port}`);
});

db.connect().catch((error) => {
  db.markUnavailable(error);
  console.warn('[server] SAP HANA connection unavailable. Server started in degraded mode.');
});
