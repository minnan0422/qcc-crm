import { Router } from 'express';
import { query } from '../db.js';
import { ah, ctx, ok } from '../http.js';
import { mapTarget } from '../mappers.js';

export const targetsRouter = Router();

targetsRouter.get(
  '/targets',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const rows = await query(
      `SELECT * FROM target WHERE organization_id=$1
       ORDER BY year DESC, month DESC, user_id`,
      [orgId],
    );
    ok(res, rows.map(mapTarget));
  }),
);
