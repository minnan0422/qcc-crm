import { preCreditsApi } from '@/api/crm';
import { useListQuery } from '@/hooks/useListQuery';
import { PageHeader, SearchInput } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { MoneyText } from '@/components/ui/MoneyText';
import { StatusTag } from '@/components/ui/StatusTag';
import { ApprovalBadge } from '@/components/ui/ApprovalBadge';
import { formatDate } from '@/lib/format';
import type { PreCredit } from '@/types';

const STATUS: Record<number, { label: string; kind: 'warning' | 'info' | 'neutral' }> = {
  1: { label: '未授信', kind: 'warning' },
  2: { label: '授信中', kind: 'info' },
  3: { label: '已结束', kind: 'neutral' },
};

export function PreCreditsPage() {
  const q = useListQuery<PreCredit>('pre-credits', preCreditsApi.list);

  const columns: Column<PreCredit>[] = [
    { key: 'customerName', header: '客户', render: (r) => <span className="font-medium text-primary">{r.customerName}</span> },
    { key: 'amount', header: '授信金额', numeric: true, sortable: true, render: (r) => <MoneyText value={r.amount} strong /> },
    { key: 'termDays', header: '期限(天)', numeric: true, render: (r) => `${r.termDays} 天` },
    { key: 'beginDate', header: '开始日', numeric: true, render: (r) => formatDate(r.beginDate) },
    { key: 'endDate', header: '结束日', numeric: true, render: (r) => formatDate(r.endDate) },
    { key: 'expectSignDate', header: '预计签约', numeric: true, render: (r) => formatDate(r.expectSignDate) },
    { key: 'expectReceiveDate', header: '预计回款', numeric: true, render: (r) => formatDate(r.expectReceiveDate) },
    { key: 'status', header: '状态', render: (r) => <StatusTag {...STATUS[r.status]} /> },
    { key: 'approval', header: '审批', render: (r) => <ApprovalBadge approval={r.approval} /> },
  ];

  return (
    <div>
      <PageHeader
        title="预授信"
        description="先用后签场景的授信额度与期限管理"
        extra={<SearchInput value={q.keyword} onChange={q.setKeyword} placeholder="搜索客户" />}
      />
      <DataTable
        columns={columns}
        data={q.data}
        rowKey={(r) => r.preCreditId}
        loading={q.isLoading}
        error={q.isError}
        onRetry={q.refetch}
        sort={q.sort}
        onSortChange={q.setSort}
        pagination={{ page: q.page, pageSize: q.pageSize, total: q.total, onChange: q.setPage }}
      />
    </div>
  );
}
