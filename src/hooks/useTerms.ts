import { useQuery } from '@tanstack/react-query';
import { termsApi } from '@/api/crm';
import type { StatusKind, Term } from '@/types';

// §9.4 启动拉取字典，缓存为 Map<businessType, Term[]>
export function useTermsMap() {
  const { data } = useQuery({
    queryKey: ['terms'],
    queryFn: () => termsApi.all(),
    staleTime: Infinity,
  });
  const list = data ?? [];
  return list;
}

export function useTerm() {
  const list = useTermsMap();
  const byId = new Map<number, Term>();
  const byType = new Map<number, Term[]>();
  for (const t of list) {
    byId.set(t.termId, t);
    const arr = byType.get(t.businessType) ?? [];
    arr.push(t);
    byType.set(t.businessType, arr);
  }

  return {
    /** 翻译单个 term_id 为名称 */
    name: (id?: number | null): string => (id == null ? '—' : byId.get(id)?.name ?? `#${id}`),
    /** 取语义色 */
    kind: (id?: number | null): StatusKind => (id == null ? 'neutral' : byId.get(id)?.kind ?? 'neutral'),
    /** 取某类型的全部选项（按 order） */
    options: (businessType: number): Term[] =>
      (byType.get(businessType) ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    get: (id?: number | null) => (id == null ? undefined : byId.get(id)),
  };
}
