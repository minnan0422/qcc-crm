import { Router } from 'express';
import { query } from '../db.js';
import { ah, ctx, ok, parseList } from '../http.js';
import { runList } from '../list.js';
import { mapProduct } from '../mappers.js';

export const productsRouter = Router();

const TABLE = 'product p LEFT JOIN product_category pc ON pc.category_id = p.category_id';
const SELECT = 'p.*, pc.name AS category_name';

productsRouter.post(
  '/products/list',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const body = parseList(req);
    const result = await runList(
      {
        table: TABLE,
        select: SELECT,
        searchCols: ['p.name', 'p.code'],
        sortMap: { price: 'p.price' },
        defaultOrder: 'p.product_id',
        baseConds: ['p.organization_id = $1'],
        baseParams: [orgId],
        mapRow: mapProduct,
      },
      body,
    );
    ok(res, result);
  }),
);

productsRouter.get(
  '/products',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const rows = await query(`${'SELECT ' + SELECT + ' FROM ' + TABLE} WHERE p.organization_id=$1 AND p.active=true ORDER BY p.product_id`, [orgId]);
    ok(res, rows.map(mapProduct));
  }),
);
