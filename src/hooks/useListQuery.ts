import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ListParams } from '@/api/client';
import type { PageResult } from '@/types';
import type { SortState } from '@/components/ui/DataTable';

// 统一列表状态管理：tab / 关键字 / 分页 / 排序 + TanStack Query
export function useListQuery<T>(
  key: string,
  fetcher: (p: ListParams) => Promise<PageResult<T>>,
  opts: { pageSize?: number; defaultTab?: string } = {},
) {
  const [tab, setTab] = useState(opts.defaultTab ?? 'all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState | undefined>();

  const pageSize = opts.pageSize ?? 20;
  const params: ListParams = { tab, keyword, page, pageSize, sort };

  const query = useQuery({
    queryKey: [key, tab, keyword, page, sort],
    queryFn: () => fetcher(params),
    placeholderData: keepPreviousData,
  });

  return {
    tab,
    setTab: (t: string) => {
      setTab(t);
      setPage(1);
    },
    keyword,
    setKeyword: (k: string) => {
      setKeyword(k);
      setPage(1);
    },
    page,
    setPage,
    sort,
    setSort,
    data: query.data?.list ?? [],
    total: query.data?.total ?? 0,
    pageSize,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
