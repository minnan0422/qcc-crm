import Decimal from 'decimal.js';

// §2 金额：字符串传输 + decimal.js 运算，禁用 float
Decimal.set({ precision: 30 });

const CURRENCY_SYMBOL: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  HKD: 'HK$',
  GBP: '£',
  JPY: '¥',
};

export function d(value: string | number | undefined | null): Decimal {
  if (value === undefined || value === null || value === '') return new Decimal(0);
  return new Decimal(value);
}

export function add(...values: (string | number)[]): string {
  return values.reduce<Decimal>((acc, v) => acc.plus(d(v)), new Decimal(0)).toFixed(2);
}

export function mul(a: string | number, b: string | number): string {
  return d(a).times(d(b)).toFixed(2);
}

export function sub(a: string | number, b: string | number): string {
  return d(a).minus(d(b)).toFixed(2);
}

/** 安全比率：a/b，b 为 0 返回 0 */
export function rate(a: string | number, b: string | number): string {
  const db = d(b);
  if (db.isZero()) return '0';
  return d(a).div(db).times(100).toFixed(1);
}

/** 金额格式化展示：千分位 + 币种符号 */
export function formatMoney(
  value: string | number | undefined | null,
  currency = 'CNY',
  opts: { showSymbol?: boolean; decimals?: number } = {},
): string {
  const { showSymbol = true, decimals = 2 } = opts;
  const num = d(value).toFixed(decimals);
  const [int, frac] = num.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const intAbs = int.replace('-', '');
  const grouped = intAbs.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const symbol = showSymbol ? CURRENCY_SYMBOL[currency] ?? '' : '';
  return `${sign}${symbol}${grouped}${frac ? '.' + frac : ''}`;
}

/** 紧凑金额：万/亿 */
export function formatCompact(value: string | number | undefined | null, currency = 'CNY'): string {
  const n = d(value);
  const abs = n.abs();
  const symbol = CURRENCY_SYMBOL[currency] ?? '';
  if (abs.gte(1e8)) return `${symbol}${n.div(1e8).toFixed(2)}亿`;
  if (abs.gte(1e4)) return `${symbol}${n.div(1e4).toFixed(1)}万`;
  return formatMoney(value, currency);
}

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOL[currency] ?? currency;
}
