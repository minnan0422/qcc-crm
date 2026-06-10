import type { NextFunction, Request, Response } from 'express';

// 统一返回 { code, msg, data }
export function ok<T>(res: Response, data: T) {
  res.json({ code: 0, msg: 'success', data });
}
export function fail(res: Response, msg: string, code = 1, status = 400) {
  res.status(status).json({ code, msg, data: null });
}

// 包裹 async 路由，集中错误处理
export function ah(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

export interface ListBody {
  page?: number;
  pageSize?: number;
  keyword?: string;
  tab?: string;
  filters?: Record<string, unknown>;
  sort?: { id: string; desc: boolean };
}

export function parseList(req: Request): Required<Pick<ListBody, 'page' | 'pageSize'>> & ListBody {
  const b = (req.body ?? {}) as ListBody;
  return {
    page: Math.max(1, Number(b.page) || 1),
    pageSize: Math.min(200, Math.max(1, Number(b.pageSize) || 20)),
    keyword: b.keyword?.trim() || undefined,
    tab: b.tab,
    filters: b.filters ?? {},
    sort: b.sort,
  };
}

// 当前租户 / 用户（演示：来自 env 或请求头；生产应来自鉴权）
export function ctx(req: Request) {
  return {
    orgId: Number(req.header('x-org-id') || process.env.DEFAULT_ORG_ID || 1),
    userId: Number(req.header('x-user-id') || process.env.DEFAULT_USER_ID || 1),
  };
}
