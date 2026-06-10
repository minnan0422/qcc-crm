import { Router } from 'express';
import { one, query } from '../db.js';
import { ah, ctx, fail, ok, parseList } from '../http.js';
import { runList } from '../list.js';
import { mapQuotation, mapQuotationProduct } from '../mappers.js';

export const quotationsRouter = Router();

const TABLE = 'quotation q LEFT JOIN customer c ON c.customer_id = q.customer_id';
const SELECT = 'q.*, c.name AS customer_name';

quotationsRouter.post(
  '/quotations/list',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const body = parseList(req);
    const result = await runList(
      {
        table: TABLE,
        select: SELECT,
        searchCols: ['q.name', 'q.code', 'c.name'],
        sortMap: { amount: 'q.amount' },
        defaultOrder: 'q.created_at DESC',
        baseConds: ['q.organization_id = $1'],
        baseParams: [orgId],
        mapRow: mapQuotation,
      },
      body,
    );
    ok(res, result);
  }),
);

quotationsRouter.get(
  '/quotations/:id',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const row = await one(
      `SELECT q.*, c.name AS customer_name FROM quotation q LEFT JOIN customer c ON c.customer_id=q.customer_id
       WHERE q.quotation_id=$1 AND q.organization_id=$2`,
      [req.params.id, orgId],
    );
    if (!row) return fail(res, '报价单不存在', 1, 404);
    ok(res, mapQuotation(row));
  }),
);

quotationsRouter.get(
  '/quotations/:id/products',
  ah(async (req, res) => {
    const rows = await query(
      `SELECT qp.*, p.name AS product_name FROM quotation_product qp
       LEFT JOIN product p ON p.product_id=qp.product_id WHERE qp.quotation_id=$1 ORDER BY qp.id`,
      [req.params.id],
    );
    ok(res, rows.map(mapQuotationProduct));
  }),
);
