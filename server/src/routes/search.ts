import { Router } from 'express';
import { query } from '../db.js';
import { ah, ctx, ok } from '../http.js';

export const searchRouter = Router();

// 跨实体搜索（CommandPalette ⌘K），用 trgm 索引
searchRouter.get(
  '/search',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const kw = String(req.query.kw ?? '').trim();
    if (!kw) return ok(res, []);
    const like = `%${kw}%`;
    const hits: any[] = [];

    const customers = await query(
      `SELECT customer_id, name, industry, category FROM customer
       WHERE organization_id=$1 AND name ILIKE $2 ORDER BY name LIMIT 5`,
      [orgId, like],
    );
    for (const c of customers)
      hits.push({
        group: '客户',
        id: c.customer_id,
        title: c.name,
        subtitle: c.industry ?? '',
        path: c.category >= 3 ? `/customers/${c.customer_id}` : `/leads/${c.customer_id}`,
      });

    const opps = await query(
      `SELECT opportunity_id, name, code FROM opportunity
       WHERE organization_id=$1 AND (name ILIKE $2 OR code ILIKE $2) ORDER BY name LIMIT 5`,
      [orgId, like],
    );
    for (const o of opps) hits.push({ group: '商机', id: o.opportunity_id, title: o.name, subtitle: o.code, path: `/opportunities/${o.opportunity_id}` });

    const contracts = await query(
      `SELECT contract_id, name, code FROM contract
       WHERE organization_id=$1 AND (name ILIKE $2 OR code ILIKE $2) ORDER BY name LIMIT 5`,
      [orgId, like],
    );
    for (const c of contracts) hits.push({ group: '合同', id: c.contract_id, title: c.name, subtitle: c.code, path: `/contracts/${c.contract_id}` });

    const contacts = await query(
      `SELECT ct.contact_id, ct.name, ct.position, ct.customer_id FROM contact ct
       JOIN customer c ON c.customer_id=ct.customer_id
       WHERE c.organization_id=$1 AND ct.name ILIKE $2 ORDER BY ct.name LIMIT 4`,
      [orgId, like],
    );
    for (const c of contacts) hits.push({ group: '联系人', id: c.contact_id, title: c.name, subtitle: c.position ?? '', path: `/customers/${c.customer_id}` });

    ok(res, hits);
  }),
);
