import { ExternalLink } from 'lucide-react';
import { invoicesApi } from '@/api/crm';
import { useListQuery } from '@/hooks/useListQuery';
import { PageHeader, SearchInput } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { MoneyText } from '@/components/ui/MoneyText';
import { StatusTag } from '@/components/ui/StatusTag';
import { ApprovalBadge } from '@/components/ui/ApprovalBadge';
import { useTerm } from '@/hooks/useTerms';
import { formatDate } from '@/lib/format';
import type { Invoice } from '@/types';

const STATUS = ['待开票', '已生成', '红冲', '作废'];
const STATUS_KIND: ('warning' | 'success' | 'danger' | 'danger')[] = ['warning', 'success', 'danger', 'danger'];

export function InvoicesPage() {
  const q = useListQuery<Invoice>('invoices', invoicesApi.list);
  const term = useTerm();

  const columns: Column<Invoice>[] = [
    { key: 'code', header: '发票号', render: (r) => <span className="font-medium text-primary">{r.code}</span> },
    { key: 'customerName', header: '客户' },
    { key: 'invoiceType', header: '发票种类', render: (r) => term.name(r.invoiceType) },
    { key: 'redBlueFlag', header: '蓝/红', render: (r) => <StatusTag kind={r.redBlueFlag === 1 ? 'info' : 'danger'} label={r.redBlueFlag === 1 ? '蓝票' : '红票'} dot={false} /> },
    { key: 'amount', header: '含税金额', numeric: true, sortable: true, render: (r) => <MoneyText value={r.amount} strong /> },
    { key: 'taxAmount', header: '税额', numeric: true, render: (r) => <MoneyText value={r.taxAmount} /> },
    { key: 'noTaxAmount', header: '不含税', numeric: true, render: (r) => <MoneyText value={r.noTaxAmount} /> },
    { key: 'status', header: '状态', render: (r) => <StatusTag kind={STATUS_KIND[r.status]} label={STATUS[r.status]} /> },
    { key: 'approval', header: '审批', render: (r) => <ApprovalBadge approval={r.approval} /> },
    { key: 'createDate', header: '开票日期', numeric: true, render: (r) => formatDate(r.createDate) },
    {
      key: 'invoiceUrl',
      header: '乐企链接',
      render: (r) =>
        r.invoiceUrl ? (
          <a href={r.invoiceUrl} onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-1 text-primary">
            查看 <ExternalLink size={12} />
          </a>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="开票"
        description="发票核销 · 蓝红冲 · 乐企开票 · 开票/作废审批"
        extra={<SearchInput value={q.keyword} onChange={q.setKeyword} placeholder="搜索发票号 / 客户" />}
      />
      <DataTable
        columns={columns}
        data={q.data}
        rowKey={(r) => r.invoiceId}
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
