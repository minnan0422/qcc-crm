// 真实后端实现（Express + Postgres）。当设置 VITE_API_BASE 时启用（见 crm.ts）。
// 统一返回 { code, msg, data }，与 §2 约定一致。
import type { ListParams } from './client';
import type {
  AiReport,
  BackLog,
  Contact,
  Contract,
  Customer,
  Invoice,
  Opportunity,
  PageResult,
  Payment,
  PreCredit,
  Product,
  Quotation,
  QuotationProduct,
  Target,
  Term,
  Tracking,
} from '@/types';
import type { SearchHit } from './mock';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';
const ORG = (import.meta.env.VITE_ORG_ID as string | undefined) ?? '1';
const USER = (import.meta.env.VITE_USER_ID as string | undefined) ?? '1';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/crm${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-org-id': ORG,
      'x-user-id': USER,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok && res.status >= 500) throw new Error(`HTTP ${res.status}`);
  const body = (await res.json()) as { code: number; msg: string; data: T };
  if (body.code !== 0) throw new Error(body.msg || '请求失败');
  return body.data;
}

const get = <T>(path: string) => req<T>(path);
const post = <T>(path: string, payload?: unknown) =>
  req<T>(path, { method: 'POST', body: JSON.stringify(payload ?? {}) });
const put = <T>(path: string, payload?: unknown) =>
  req<T>(path, { method: 'PUT', body: JSON.stringify(payload ?? {}) });
const list = <T>(path: string, p: ListParams) => post<PageResult<T>>(path, p);

export const termsApi = { all: () => get<Term[]>('/terms') };

export const leadsApi = {
  list: (p: ListParams) => list<Customer>('/leads/list', p),
  get: (id: number) => get<Customer>(`/leads/${id}`),
  convert: (id: number) => post<Customer>(`/leads/${id}/convert`),
  create: (input: Partial<Customer>) => post<Customer>('/leads', input),
};

export const customersApi = {
  list: (p: ListParams) => list<Customer>('/customers/list', p),
  get: (id: number) => get<Customer>(`/customers/${id}`),
  contacts: (customerId: number) => get<Contact[]>(`/customers/${customerId}/contacts`),
  trackings: (customerId: number) => get<Tracking[]>(`/customers/${customerId}/trackings`),
  create: (input: Partial<Customer>) => post<Customer>('/customers', input),
};

export const opportunitiesApi = {
  list: (p: ListParams) => list<Opportunity>('/opportunities/list', p),
  get: (id: number) => get<Opportunity>(`/opportunities/${id}`),
  updateStage: (id: number, status: number) => put<Opportunity>(`/opportunities/${id}/stage`, { status }),
  create: (input: Partial<Opportunity>) => post<Opportunity>('/opportunities', input),
};

export const quotationsApi = {
  list: (p: ListParams) => list<Quotation>('/quotations/list', p),
  get: (id: number) => get<Quotation>(`/quotations/${id}`),
  products: (quotationId: number) => get<QuotationProduct[]>(`/quotations/${quotationId}/products`),
};

export const contractsApi = {
  list: (p: ListParams) => list<Contract>('/contracts/list', p),
  get: (id: number) => get<Contract>(`/contracts/${id}`),
  payments: (contractId: number) => get<Payment[]>(`/contracts/${contractId}/payments`),
  paymentSheets: (_contractId: number) => Promise.resolve([] as never[]),
  invoices: (contractId: number) => get<Invoice[]>(`/contracts/${contractId}/invoices`),
  create: (input: Record<string, unknown>) => post<Contract>('/contracts', input),
};

export const paymentsApi = {
  list: (p: ListParams) => list<Payment>('/payments/list', p),
  sheets: (p: ListParams) => list('/payments/list', p),
};
export const invoicesApi = { list: (p: ListParams) => list<Invoice>('/invoices/list', p) };
export const preCreditsApi = { list: (p: ListParams) => list<PreCredit>('/pre-credits/list', p) };

export const productsApi = {
  list: (p: ListParams) => list<Product>('/products/list', p),
  all: () => get<Product[]>('/products'),
};

export const tasksApi = {
  list: (p: ListParams) => list<BackLog>('/tasks/list', p),
  complete: (id: number) => post<BackLog>(`/tasks/${id}/complete`),
  counts: () => get<Record<number, number>>('/tasks/counts'),
};

export const targetsApi = { list: () => get<Target[]>('/targets') };

export const aiApi = {
  generate: (businessType: 0 | 1 | 2 | 3, businessId: number, stageId?: number) =>
    post<AiReport>('/ai/generate', { businessType, businessId, stageId }),
};

export const searchApi = {
  query: (kw: string) => get<SearchHit[]>(`/search?kw=${encodeURIComponent(kw)}`),
};
