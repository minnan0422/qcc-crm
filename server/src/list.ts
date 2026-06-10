import { query } from './db.js';
import type { ListBody } from './http.js';

export type FilterKind = 'eq' | 'in' | 'numRange' | 'dateRange' | 'contains' | 'array';
export interface FilterDef {
  col: string;
  kind: FilterKind;
}

export interface ListConfig<Row> {
  table: string;
  /** 默认 SELECT *，可指定列 */
  select?: string;
  /** 关键字 ILIKE 命中的列 */
  searchCols?: string[];
  /** 前端 filter key → DB 列与类型 */
  filterMap?: Record<string, FilterDef>;
  /** 前端 sort id → DB 列 */
  sortMap?: Record<string, string>;
  /** 兜底排序 */
  defaultOrder?: string;
  /** 基础条件（如租户、tab 派生）。$ 占位由 builder 续接 */
  baseConds?: string[];
  baseParams?: unknown[];
  mapRow: (row: any) => Row;
}

export interface ListResult<Row> {
  list: Row[];
  total: number;
}

const isEmpty = (v: unknown) =>
  v === undefined ||
  v === null ||
  v === '' ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.values(v as object).every((x) => x === undefined || x === null || x === ''));

export async function runList<Row>(cfg: ListConfig<Row>, body: ListBody): Promise<ListResult<Row>> {
  const conds: string[] = [...(cfg.baseConds ?? [])];
  const params: unknown[] = [...(cfg.baseParams ?? [])];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };

  // 关键字
  if (body.keyword && cfg.searchCols?.length) {
    const ph = p(`%${body.keyword}%`);
    conds.push('(' + cfg.searchCols.map((c) => `${c} ILIKE ${ph}`).join(' OR ') + ')');
  }

  // 过滤器
  if (body.filters && cfg.filterMap) {
    for (const [key, val] of Object.entries(body.filters)) {
      const def = cfg.filterMap[key];
      if (!def || isEmpty(val)) continue;
      switch (def.kind) {
        case 'eq':
          conds.push(`${def.col} = ${p(val)}`);
          break;
        case 'in':
          conds.push(`${def.col} = ANY(${p(val)})`); // val: 数组
          break;
        case 'array': // 行内数组与所选交集
          conds.push(`${def.col} && ${p(val)}`);
          break;
        case 'contains':
          conds.push(`${def.col} ILIKE ${p('%' + (val as any).contains + '%')}`);
          break;
        case 'numRange': {
          const o = val as { min?: unknown; max?: unknown };
          if (o.min != null && o.min !== '') conds.push(`${def.col} >= ${p(o.min)}`);
          if (o.max != null && o.max !== '') conds.push(`${def.col} <= ${p(o.max)}`);
          break;
        }
        case 'dateRange': {
          const o = val as { start?: string; end?: string };
          if (o.start) conds.push(`${def.col} >= ${p(o.start)}`);
          if (o.end) conds.push(`${def.col} < (${p(o.end)}::date + 1)`);
          break;
        }
      }
    }
  }

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

  // 总数
  const countRows = await query<{ count: string }>(`SELECT count(*)::int AS count FROM ${cfg.table} ${where}`, params);
  const total = Number(countRows[0]?.count ?? 0);

  // 排序
  let orderBy = cfg.defaultOrder ? `ORDER BY ${cfg.defaultOrder}` : '';
  if (body.sort && cfg.sortMap?.[body.sort.id]) {
    orderBy = `ORDER BY ${cfg.sortMap[body.sort.id]} ${body.sort.desc ? 'DESC' : 'ASC'} NULLS LAST`;
  }

  const page = Math.max(1, body.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, body.pageSize ?? 20));
  const limit = p(pageSize);
  const offset = p((page - 1) * pageSize);

  const rows = await query(
    `SELECT ${cfg.select ?? '*'} FROM ${cfg.table} ${where} ${orderBy} LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  return { list: rows.map(cfg.mapRow), total };
}
