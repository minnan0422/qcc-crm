import { useNavigate } from 'react-router-dom';
import { contractsApi } from '@/api/crm';
import { useListQuery } from '@/hooks/useListQuery';
import { PageHeader, SearchInput } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/primitives';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Tabs } from '@/components/ui/Tabs';
import { MoneyText } from '@/components/ui/MoneyText';
import { StatusTag } from '@/components/ui/StatusTag';
import { TermTags } from '@/components/ui/TermTag';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { currencySymbol } from '@/lib/money';
import { formatDate, daysUntil } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Contract } from '@/types';

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'archived', label: '已归档' },
  { key: 'renew', label: '待续约' },
];

const STATUS: Record<number, { label: string; kind: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
  0: { label: '初始', kind: 'neutral' },
  1: { label: '签约', kind: 'info' },
  2: { label: '执行中', kind: 'info' },
  3: { label: '完毕', kind: 'success' },
  4: { label: '终止', kind: 'danger' },
  5: { label: '作废', kind: 'danger' },
};

export function ContractsPage() {
  const q = useListQuery<Contract>('contracts', contractsApi.list);
  const navigate = useNavigate();

  const columns: Column<Contract>[] = [
    { key: 'code', header: '合同编号', render: (r) => <span className="font-medium text-primary">{r.code}</span> },
    { key: 'name', header: '合同名称' },
    { key: 'customerName', header: '客户' },
    { key: 'labels', header: '客户标签', render: (r) => <TermTags ids={r.labels} /> },
    { key: 'currency', header: '币种', render: (r) => currencySymbol(r.currency) },
    { key: 'amount', header: '合同金额', numeric: true, sortable: true, render: (r) => <MoneyText value={r.amount} currency={r.currency} strong /> },
    { key: 'receivedAmount', header: '已回款', numeric: true, render: (r) => <MoneyText value={r.receivedAmount} currency={r.currency} /> },
    { key: 'outstandingAmount', header: '未回款', numeric: true, render: (r) => <MoneyText value={r.outstandingAmount} currency={r.currency} className="text-warning" /> },
    { key: 'invoiceAmount', header: '开票额', numeric: true, render: (r) => <MoneyText value={r.invoiceAmount} currency={r.currency} /> },
    {
      key: 'receivedRate',
      header: '收款比例',
      width: 130,
      render: (r) => <ProgressBar value={Number(r.receivedRate)} />,
    },
    {
      key: 'expiredDate',
      header: '到期日',
      numeric: true,
      sortable: true,
      render: (r) => {
        const left = daysUntil(r.expiredDate);
        return <span className={cn('tabular-nums', left >= 0 && left <= 30 && 'font-medium text-warning')}>{formatDate(r.expiredDate)}</span>;
      },
    },
    { key: 'status', header: '状态', render: (r) => <StatusTag {...STATUS[r.status]} /> },
  ];

  return (
    <div>
      <PageHeader
        title="合同订单"
        description="收款进度可视化 · 自动续约提醒 · 一站式建回款/开票"
        extra={
          <>
            <SearchInput value={q.keyword} onChange={q.setKeyword} placeholder="搜索合同 / 编号 / 客户" />
            <Button variant="primary" size="md">新建合同</Button>
          </>
        }
      />
      <div className="mb-3">
        <Tabs items={TABS} value={q.tab} onChange={q.setTab} className="border-0" />
      </div>
      <DataTable
        columns={columns}
        data={q.data}
        rowKey={(r) => r.contractId}
        loading={q.isLoading}
        error={q.isError}
        onRetry={q.refetch}
        onRowClick={(r) => navigate(`/contracts/${r.contractId}`)}
        sort={q.sort}
        onSortChange={q.setSort}
        pagination={{ page: q.page, pageSize: q.pageSize, total: q.total, onChange: q.setPage }}
      />
    </div>
  );
}
