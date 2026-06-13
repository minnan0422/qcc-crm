import { Router } from 'express';
import { z } from 'zod';
import { one, query } from '../db.js';
import { ah, ctx, fail, ok, parseList } from '../http.js';
import { runList } from '../list.js';
import { pushMessage } from '../services/wecom.js';

export const collabRouter = Router();

const mapSign = (r: any) => ({
  signId: r.sign_id, userId: r.user_id, userName: r.user_name, type: r.type,
  customerId: r.customer_id, customerName: r.customer_name, address: r.address,
  longitude: r.longitude, latitude: r.latitude, remark: r.remark, photoUrl: r.photo_url, createDate: r.created_at,
});
const mapTicket = (r: any) => ({
  ticketId: r.ticket_id, code: r.code, title: r.title, typeTerm: r.type_term_id,
  customerId: r.customer_id, customerName: r.customer_name, priority: r.priority, status: r.status,
  assigneeId: r.assignee_id, assigneeName: r.assignee_name, creatorId: r.creator_id,
  description: r.description, createDate: r.created_at, updateDate: r.updated_at,
});
const mapMsg = (r: any) => ({
  msgId: r.msg_id, toUserId: r.to_user_id, toUserName: r.to_user_name, businessType: r.business_type,
  businessId: r.business_id, content: r.content, channel: r.channel, status: r.status, createDate: r.created_at,
});

// ---------- 外勤签到 ----------
collabRouter.post('/sign/list', ah(async (req, res) => {
  const { orgId, userId } = ctx(req);
  const body = parseList(req);
  const conds = ['s.organization_id = $1'];
  const params: unknown[] = [orgId];
  if (body.tab !== 'team') { conds.push('s.user_id = $2'); params.push(userId); }
  const result = await runList({
    table: 'sign s LEFT JOIN app_user u ON u.user_id=s.user_id LEFT JOIN customer c ON c.customer_id=s.customer_id',
    select: 's.*, u.name AS user_name, c.name AS customer_name',
    searchCols: ['c.name', 's.address', 's.remark'],
    defaultOrder: 's.created_at DESC',
    baseConds: conds, baseParams: params, mapRow: mapSign,
  }, body);
  ok(res, result);
}));

const signSchema = z.object({
  type: z.coerce.number().int().min(1).max(2).default(2),
  customerId: z.coerce.number().int().optional(),
  address: z.string().optional(),
  longitude: z.coerce.number().optional(),
  latitude: z.coerce.number().optional(),
  remark: z.string().optional(),
});
collabRouter.post('/sign', ah(async (req, res) => {
  const { orgId, userId } = ctx(req);
  const d = signSchema.parse(req.body);
  const row = await one(
    `INSERT INTO sign (organization_id, user_id, type, customer_id, address, longitude, latitude, remark)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [orgId, userId, d.type, d.customerId ?? null, d.address ?? null, d.longitude ?? null, d.latitude ?? null, d.remark ?? null],
  );
  ok(res, mapSign(row));
}));

// ---------- 工单 ----------
collabRouter.post('/tickets/list', ah(async (req, res) => {
  const { orgId } = ctx(req);
  const body = parseList(req);
  const conds = ['t.organization_id = $1'];
  if (body.tab === 'open') conds.push('t.status IN (1,2)');
  else if (body.tab === 'mine') conds.push('t.assignee_id = ' + Number(ctx(req).userId));
  else if (body.tab === 'closed') conds.push('t.status IN (3,4)');
  const result = await runList({
    table: 'ticket t LEFT JOIN customer c ON c.customer_id=t.customer_id LEFT JOIN app_user u ON u.user_id=t.assignee_id',
    select: 't.*, c.name AS customer_name, u.name AS assignee_name',
    searchCols: ['t.title', 't.code', 'c.name'],
    filterMap: { status: { col: 't.status', kind: 'in' }, priority: { col: 't.priority', kind: 'in' }, assigneeId: { col: 't.assignee_id', kind: 'eq' } },
    sortMap: { priority: 't.priority', createDate: 't.created_at' },
    defaultOrder: 't.created_at DESC',
    baseConds: conds, baseParams: [orgId], mapRow: mapTicket,
  }, body);
  ok(res, result);
}));

collabRouter.get('/tickets/:id', ah(async (req, res) => {
  const { orgId } = ctx(req);
  const row = await one(
    `SELECT t.*, c.name AS customer_name, u.name AS assignee_name FROM ticket t
     LEFT JOIN customer c ON c.customer_id=t.customer_id LEFT JOIN app_user u ON u.user_id=t.assignee_id
     WHERE t.ticket_id=$1 AND t.organization_id=$2`, [req.params.id, orgId]);
  if (!row) return fail(res, '工单不存在', 1, 404);
  ok(res, mapTicket(row));
}));

collabRouter.get('/tickets/:id/comments', ah(async (req, res) => {
  const rows = await query(
    `SELECT tc.*, u.name AS user_name FROM ticket_comment tc LEFT JOIN app_user u ON u.user_id=tc.user_id
     WHERE tc.ticket_id=$1 ORDER BY tc.created_at`, [req.params.id]);
  ok(res, rows.map((r: any) => ({ id: r.id, ticketId: r.ticket_id, userId: r.user_id, userName: r.user_name, content: r.content, createDate: r.created_at })));
}));

const ticketSchema = z.object({
  title: z.string().min(2), typeTerm: z.coerce.number().int().optional(),
  customerId: z.coerce.number().int().optional(), priority: z.coerce.number().int().min(1).max(3).default(2),
  assigneeId: z.coerce.number().int().optional(), description: z.string().optional(),
});
collabRouter.post('/tickets', ah(async (req, res) => {
  const { orgId, userId } = ctx(req);
  const d = ticketSchema.parse(req.body);
  const seq = await one<{ n: number }>(`SELECT count(*)+1 AS n FROM ticket WHERE organization_id=$1`, [orgId]);
  const code = `WO${new Date().getFullYear()}${String(seq!.n).padStart(4, '0')}`;
  const row = await one(
    `INSERT INTO ticket (organization_id, code, title, type_term_id, customer_id, priority, status, assignee_id, creator_id, description)
     VALUES ($1,$2,$3,$4,$5,$6,1,$7,$8,$9) RETURNING *`,
    [orgId, code, d.title, d.typeTerm ?? null, d.customerId ?? null, d.priority, d.assigneeId ?? null, userId, d.description ?? null]);
  if (d.assigneeId) await pushMessage(orgId, d.assigneeId, `你有新工单待处理：${d.title}（${code}）`, 7, row.ticket_id);
  ok(res, mapTicket(row));
}));

collabRouter.put('/tickets/:id/status', ah(async (req, res) => {
  const { orgId } = ctx(req);
  const status = Number(req.body?.status);
  if (![1, 2, 3, 4].includes(status)) return fail(res, '非法状态');
  const row = await one(`UPDATE ticket SET status=$1 WHERE ticket_id=$2 AND organization_id=$3 RETURNING *`, [status, req.params.id, orgId]);
  if (!row) return fail(res, '工单不存在', 1, 404);
  ok(res, mapTicket(row));
}));

collabRouter.post('/tickets/:id/comments', ah(async (req, res) => {
  const { userId } = ctx(req);
  const content = String(req.body?.content || '').trim();
  if (!content) return fail(res, '评论不能为空');
  const row = await one(`INSERT INTO ticket_comment (ticket_id, user_id, content) VALUES ($1,$2,$3) RETURNING *`, [req.params.id, userId, content]);
  ok(res, { id: row.id, ticketId: row.ticket_id, userId: row.user_id, content: row.content, createDate: row.created_at });
}));

// ---------- 企微协同：消息记录 ----------
collabRouter.post('/qywx/list', ah(async (req, res) => {
  const { orgId } = ctx(req);
  const body = parseList(req);
  const result = await runList({
    table: 'qywx_message m LEFT JOIN app_user u ON u.user_id=m.to_user_id',
    select: 'm.*, u.name AS to_user_name',
    searchCols: ['m.content'],
    defaultOrder: 'm.created_at DESC',
    baseConds: ['m.organization_id = $1'], baseParams: [orgId], mapRow: mapMsg,
  }, body);
  ok(res, result);
}));

collabRouter.post('/qywx/send', ah(async (req, res) => {
  const { orgId } = ctx(req);
  const toUserId = req.body?.toUserId ? Number(req.body.toUserId) : null;
  const content = String(req.body?.content || '').trim();
  if (!content) return fail(res, '内容不能为空');
  await pushMessage(orgId, toUserId, content);
  ok(res, { ok: true });
}));
