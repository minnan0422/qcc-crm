import { Router } from 'express';
import { one, query } from '../db.js';
import { ah, ctx, fail, ok, parseList } from '../http.js';
import { runList } from '../list.js';
import { mapBackLog } from '../mappers.js';

export const tasksRouter = Router();

tasksRouter.post(
  '/tasks/list',
  ah(async (req, res) => {
    const { orgId, userId } = ctx(req);
    const body = parseList(req);
    const conds = ['organization_id = $1'];
    const params: unknown[] = [orgId];
    if (body.tab !== 'team') {
      conds.push(`user_id = $2`);
      params.push(userId);
    }
    const result = await runList(
      {
        table: 'back_log',
        searchCols: ['business_name'],
        defaultOrder: 'deadline_date NULLS LAST',
        baseConds: conds,
        baseParams: params,
        mapRow: mapBackLog,
      },
      body,
    );
    ok(res, result);
  }),
);

tasksRouter.post(
  '/tasks/:id/complete',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const row = await one(
      `UPDATE back_log SET status=1 WHERE back_log_id=$1 AND organization_id=$2 RETURNING *`,
      [req.params.id, orgId],
    );
    if (!row) return fail(res, '待办不存在', 1, 404);
    ok(res, mapBackLog(row));
  }),
);

tasksRouter.get(
  '/tasks/counts',
  ah(async (req, res) => {
    const { orgId, userId } = ctx(req);
    const rows = await query<{ business_type: number; n: number }>(
      `SELECT business_type, count(*)::int AS n FROM back_log
       WHERE organization_id=$1 AND user_id=$2 AND status=0 GROUP BY business_type`,
      [orgId, userId],
    );
    const map: Record<number, number> = {};
    for (const r of rows) map[r.business_type] = r.n;
    ok(res, map);
  }),
);
