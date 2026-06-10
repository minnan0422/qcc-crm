import { Router } from 'express';
import { ah, ctx, ok, parseList } from '../http.js';
import { runList } from '../list.js';
import { mapInvoice, mapPayment, mapPreCredit } from '../mappers.js';

export const financeRouter = Router();

// 回款计划（含合同编号、客户名）
financeRouter.post(
  '/payments/list',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const body = parseList(req);
    const result = await runList(
      {
        table: 'payment p LEFT JOIN contract ct ON ct.contract_id=p.contract_id LEFT JOIN customer c ON c.customer_id=p.customer_id',
        select: 'p.*, ct.code AS contract_code, c.name AS customer_name',
        searchCols: ['ct.code', 'c.name'],
        sortMap: { planAmount: 'p.plan_amount', planDate: 'p.plan_date' },
        defaultOrder: 'p.plan_date NULLS LAST',
        baseConds: ['p.organization_id = $1'],
        baseParams: [orgId],
        mapRow: mapPayment,
      },
      body,
    );
    ok(res, result);
  }),
);

financeRouter.post(
  '/invoices/list',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const body = parseList(req);
    const result = await runList(
      {
        table: 'invoice i LEFT JOIN customer c ON c.customer_id=i.customer_id',
        select: 'i.*, c.name AS customer_name',
        searchCols: ['i.code', 'c.name'],
        sortMap: { amount: 'i.amount' },
        defaultOrder: 'i.created_at DESC',
        baseConds: ['i.organization_id = $1'],
        baseParams: [orgId],
        mapRow: mapInvoice,
      },
      body,
    );
    ok(res, result);
  }),
);

financeRouter.post(
  '/pre-credits/list',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const body = parseList(req);
    const result = await runList(
      {
        table: 'pre_credit pc LEFT JOIN customer c ON c.customer_id=pc.customer_id',
        select: 'pc.*, c.name AS customer_name',
        searchCols: ['c.name'],
        sortMap: { amount: 'pc.amount' },
        defaultOrder: 'pc.created_at DESC',
        baseConds: ['pc.organization_id = $1'],
        baseParams: [orgId],
        mapRow: mapPreCredit,
      },
      body,
    );
    ok(res, result);
  }),
);
