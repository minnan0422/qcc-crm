import { Router } from 'express';
import { query } from '../db.js';
import { ah, ctx, ok } from '../http.js';
import { mapTerm } from '../mappers.js';

export const termsRouter = Router();

// 系统级(org 为空) + 本租户自定义
termsRouter.get(
  '/terms',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const rows = await query(
      `SELECT * FROM term WHERE active=1 AND (organization_id IS NULL OR organization_id=$1)
       ORDER BY business_type, sort_order`,
      [orgId],
    );
    ok(res, rows.map(mapTerm));
  }),
);
