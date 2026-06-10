import { Router } from 'express';
import { z } from 'zod';
import { one, query } from '../db.js';
import { ah, ctx, fail, ok, parseList } from '../http.js';
import { runList, type FilterDef } from '../list.js';
import { mapCustomer } from '../mappers.js';

export const leadsRouter = Router();

const FILTERS: Record<string, FilterDef> = {
  source: { col: 'source_term_id', kind: 'eq' },
  poolGroup: { col: 'pool_group_term_id', kind: 'in' },
  currentTrackingStatus: { col: 'status_term_id', kind: 'in' },
  leaderId: { col: 'leader_id', kind: 'eq' },
  province: { col: 'province', kind: 'contains' },
  trackingUpdateDate: { col: 'tracking_update_at', kind: 'dateRange' },
};

leadsRouter.post(
  '/leads/list',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const body = parseList(req);
    const conds = ['organization_id = $1', 'active = 1', 'category IN (1,2)'];
    const params: unknown[] = [orgId];
    if (body.tab === 'pool') conds.push('category = 2');
    else if (body.tab === 'mine') conds.push('category = 1');
    else if (body.tab === 'converted') conds.push('status_term_id = 17');

    const result = await runList(
      {
        table: 'customer',
        searchCols: ['name', 'industry', 'phone_name'],
        filterMap: FILTERS,
        sortMap: { trackingUpdateDate: 'tracking_update_at' },
        defaultOrder: 'created_at DESC',
        baseConds: conds,
        baseParams: params,
        mapRow: mapCustomer,
      },
      body,
    );
    ok(res, result);
  }),
);

leadsRouter.get(
  '/leads/:id',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const row = await one(`SELECT * FROM customer WHERE customer_id=$1 AND organization_id=$2`, [req.params.id, orgId]);
    if (!row) return fail(res, '线索不存在', 1, 404);
    ok(res, mapCustomer(row));
  }),
);

// 线索转客户（category 1/2 → 3，状态置初访 8）
leadsRouter.post(
  '/leads/:id/convert',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const row = await one(
      `UPDATE customer SET category=3, status_term_id=8 WHERE customer_id=$1 AND organization_id=$2 RETURNING *`,
      [req.params.id, orgId],
    );
    if (!row) return fail(res, '线索不存在', 1, 404);
    ok(res, mapCustomer(row));
  }),
);

const createSchema = z.object({
  name: z.string().min(2),
  source: z.coerce.number().int().positive(),
  poolGroup: z.coerce.number().int().optional(),
  industry: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  phoneName: z.string().optional(),
  phone: z.string().optional(),
  leaderId: z.coerce.number().int().positive(),
});

leadsRouter.post(
  '/leads',
  ah(async (req, res) => {
    const { orgId, userId } = ctx(req);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.issues[0]?.message ?? '参数错误');
    const d = parsed.data;
    const row = await one(
      `INSERT INTO customer (organization_id, name, category, status_term_id, source_term_id, pool_group_term_id,
         industry, province, city, phone_name, phone, leader_id, created_by, tracking_update_at)
       VALUES ($1,$2,1,15,$3,$4,$5,$6,$7,$8,$9,$10,$11, now()) RETURNING *`,
      [orgId, d.name, d.source, d.poolGroup ?? null, d.industry ?? null, d.province ?? null, d.city ?? null, d.phoneName ?? null, d.phone ?? null, d.leaderId, userId],
    );
    ok(res, mapCustomer(row));
  }),
);
