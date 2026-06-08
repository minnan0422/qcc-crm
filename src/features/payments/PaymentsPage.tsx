import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { paymentsApi } from '@/api/crm';
import { useListQuery } from '@/hooks/useListQuery';
import { useUI } from '@/store/ui';
import { PageHeader, SearchInput } from '@/components/ui/PageHeader';
import { Button, Card, CardHeader } from '@/components/ui/primitives';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Tabs } from '@/components/ui/Tabs';
import { MoneyText } from '@/components/ui/MoneyText';
import { StatusTag } from '@/components/ui/StatusTag';
import { useTerm } from '@/hooks/useTerms';
import { userName } from '@/mock/org';
import { formatDate, daysUntil } from '@/lib/format';
import { formatCompact } from '@/lib/money';
import type { Payment } from '@/types';

const P_STATUS: Record<number, { label: string; kind: 'info' | 'success' | 'warning' | 'danger' }> = {
  1: { label: '未收', kind: 'warning' },
  2: { label: '部分回款', kind: 'info' },
  3: { label: '已回款', kind: 'success' },
  4: { label: '逾期', kind: 'danger' },
  5: { label: '部分坏账', kind: 'danger' },
};

export function PaymentsPage() {
  const q = useListQuery<Payment>('payments', paymentsApi.list, { pageSize: 50 });
  const [view, setView] = useState('plan');
  const term = useTerm();
  const toast = useUI((s) => s.toast);

  // 催收看板分组（§6.7）
  const { data: board } = useQuery({
    queryKey: ['payments-board'],
    queryFn: () => paymentsApi.list({ page: 1, pageSize: 999 }),
  });
  const overdue: Payment[] = [];
  const thisWeek: Payment[] = [];
  const thisMonth: Payment[] = [];
  for (const p of board?.list ?? []) {
    if (Number(p.outstandingAmount) <= 0) continue;
    const left = daysUntil(p.planDate);
    if (left < 0) overdue.push(p);
    else if (left <= 7) thisWeek.push(p);
    else if (left <= 30) thisMonth.push(p);
  }

  const columns: Column<Payment>[] = [
    { key: 'contractCode', header: '合同编号', render: (r) => <span className="font-medium text-primary">{r.contractCode}</span> },
    { key: 'customerName', header: '客户' },
    { key: 'type', header: '类型', render: (r) => term.name(r.type) },
    { key: 'planAmount', header: '计划金额', numeric: true, sortable: true, render: (r) => <MoneyText value={r.planAmount} /> },
    { key: 'receivedAmount', header: '实收', numeric: true, render: (r) => <MoneyText value={r.receivedAmount} /> },
    { key: 'outstandingAmount', header: '未收', numeric: true, render: (r) => <MoneyText value={r.outstandingAmount} className="text-warning" /> },
    { key: 'planDate', header: '预计回款日', numeric: true, sortable: true, render: (r) => formatDate(r.planDate) },
    { key: 'status', header: '状态', render: (r) => <StatusTag {...P_STATUS[r.status]} /> },
    { key: 'leaderId', header: '负责人', render: (r) => userName(r.leaderId) },
  ];

  return (
    <div>
      <PageHeader title="回款" description="回款计划 → 回款单核销 · 催收看板" extra={<SearchInput value={q.keyword} onChange={q.setKeyword} placeholder="搜索合同 / 客户" />} />

      {/* 催收看板 */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <CollectionCard title="已逾期" rows={overdue} kind="danger" onRemind={() => toast(`已提醒 ${overdue.length} 笔逾期回款负责人`, 'success')} />
        <CollectionCard title="本周到期" rows={thisWeek} kind="warning" onRemind={() => toast(`已提醒 ${thisWeek.length} 笔本周回款`, 'success')} />
        <CollectionCard title="本月到期" rows={thisMonth} kind="info" onRemind={() => toast(`已提醒 ${thisMonth.length} 笔本月回款`, 'success')} />
      </div>

      <div className="mb-3">
        <Tabs
          items={[{ key: 'plan', label: '回款计划' }, { key: 'sheet', label: '回款单' }]}
          value={view}
          onChange={setView}
          className="border-0"
        />
      </div>

      <DataTable
        columns={columns}
        data={q.data}
        rowKey={(r) => r.paymentId}
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

function CollectionCard({
  title,
  rows,
  kind,
  onRemind,
}: {
  title: string;
  rows: Payment[];
  kind: 'danger' | 'warning' | 'info';
  onRemind: () => void;
}) {
  const sum = rows.reduce((s, r) => s + Number(r.outstandingAmount), 0);
  return (
    <Card>
      <CardHeader
        title={<span className="flex items-center gap-2">{title}<StatusTag kind={kind} label={`${rows.length} 笔`} /></span>}
        extra={
          <Button size="sm" onClick={onRemind}>
            <Bell size={12} />一键提醒
          </Button>
        }
      />
      <div className="p-4">
        <div className="text-xl font-semibold text-text">{formatCompact(String(sum))}</div>
        <div className="mt-1 text-xs text-text-faint">待回款金额</div>
      </div>
    </Card>
  );
}
