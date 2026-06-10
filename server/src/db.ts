import pg from 'pg';

const { Pool, types } = pg;

// timestamptz / timestamp → ISO 字符串（前端统一按字符串处理）
types.setTypeParser(1184, (v) => (v == null ? null : new Date(v).toISOString()));
types.setTypeParser(1114, (v) => (v == null ? null : new Date(v).toISOString()));
// numeric(1700) 默认即为字符串（对齐前端金额字符串约定），不改。
// date(1082) 默认即为 'YYYY-MM-DD' 字符串，不改。
// int8(20) bigint 默认字符串 → 转为 number（主键/外键在安全范围内）
types.setTypeParser(20, (v) => (v == null ? null : Number(v)));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://crm:crm@localhost:5432/nextcrm',
  max: 10,
});

export async function query<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function one<T = any>(text: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

/** 事务包装 */
export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
