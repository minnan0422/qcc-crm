import express from 'express';
import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import { pool } from './db.js';
import { termsRouter } from './routes/terms.js';
import { leadsRouter } from './routes/leads.js';
import { customersRouter } from './routes/customers.js';
import { opportunitiesRouter } from './routes/opportunities.js';
import { quotationsRouter } from './routes/quotations.js';
import { contractsRouter } from './routes/contracts.js';
import { financeRouter } from './routes/finance.js';
import { productsRouter } from './routes/products.js';
import { tasksRouter } from './routes/tasks.js';
import { targetsRouter } from './routes/targets.js';
import { aiRouter } from './routes/ai.js';
import { searchRouter } from './routes/search.js';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
    allowedHeaders: ['Content-Type', 'x-org-id', 'x-user-id'],
  }),
);

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ code: 0, msg: 'ok', data: { db: 'up' } });
  } catch {
    res.status(500).json({ code: 1, msg: 'db down', data: null });
  }
});

// §2 统一前缀 /api/crm
const api = express.Router();
api.use(termsRouter);
api.use(leadsRouter);
api.use(customersRouter);
api.use(opportunitiesRouter);
api.use(quotationsRouter);
api.use(contractsRouter);
api.use(financeRouter);
api.use(productsRouter);
api.use(tasksRouter);
api.use(targetsRouter);
api.use(aiRouter);
api.use(searchRouter);
app.use('/api/crm', api);

// 404
app.use((_req, res) => res.status(404).json({ code: 1, msg: 'not found', data: null }));

// 统一错误处理
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err);
  const msg = err instanceof Error ? err.message : '服务器错误';
  res.status(500).json({ code: 1, msg, data: null });
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`NextCRM API listening on :${port}`));
