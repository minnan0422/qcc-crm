import type { ApiResult, PageResult } from '@/types';

/**
 * 模拟网络层。真实环境对接 §2 约定的 /api/crm/{entity}：
 *   列表 GET .../list（POST 复杂筛选），详情 GET .../{id}，写 POST/PUT/DELETE，
 *   统一返回 { code, msg, data }。
 * 此处用内存数据模拟，便于前端独立运行与演示。
 */

const LATENCY = 280;

export function delay<T>(data: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms + Math.random() * 120));
}

export function ok<T>(data: T): ApiResult<T> {
  return { code: 0, msg: 'success', data };
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  tab?: string;
  filters?: Record<string, unknown>;
  sort?: { id: string; desc: boolean };
}

/** 通用内存分页/排序/关键字过滤 */
export function paginate<T extends Record<string, any>>(
  source: T[],
  params: ListParams,
  searchKeys: (keyof T)[],
): Promise<PageResult<T>> {
  const { page = 1, pageSize = 20, keyword, sort } = params;
  let rows = [...source];

  if (keyword) {
    const kw = keyword.toLowerCase();
    rows = rows.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(kw)),
    );
  }

  // 自定义过滤器（等值/数组包含）
  if (params.filters) {
    for (const [key, val] of Object.entries(params.filters)) {
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) continue;
      rows = rows.filter((r) => {
        const cell = r[key];
        if (Array.isArray(val)) return val.includes(cell);
        return cell === val;
      });
    }
  }

  if (sort) {
    rows.sort((a, b) => {
      const av = a[sort.id];
      const bv = b[sort.id];
      const an = Number(av);
      const bn = Number(bv);
      let cmp: number;
      if (!Number.isNaN(an) && !Number.isNaN(bn)) cmp = an - bn;
      else cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      return sort.desc ? -cmp : cmp;
    });
  }

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const list = rows.slice(start, start + pageSize);
  return delay({ list, total, page, pageSize });
}
