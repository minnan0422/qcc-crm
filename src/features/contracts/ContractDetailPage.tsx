import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FilePlus2, Receipt, RefreshCw, Wallet } from 'lucide-react';
import { contractsApi } from '@/api/crm';
import { Tabs } from '@/components/ui/Tabs';
import { Button, Card, CardHeader, UserCell } from '@/components/ui/primitives';
import { Descriptions } from '@/components/ui/Descriptions';
import { MoneyText } from '@/components/ui/MoneyText';
import { StatusTag } from '@/components/ui/StatusTag';
import { ApprovalBadge } from '@/components/ui/ApprovalBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Timeline } from '@/components/ui/Timeline';
import { AiPanel } from '@/components/ai/AiPanel';
import { TableSkeleton, EmptyState } from '@/components/ui/states';
import { useUI } from '@/store/ui';
import { useTerm } from '@/hooks/useTerms';
import { userName } from '@/mock/org';
import { formatDate, daysUntil } from '@/lib/format';
import type { Invoice, Payment } from '@/types';

const C_STATUS: Record<number, { label: string; kind: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
  0: { label: '初始', kind: 'neutral' },
  1: { label: '签约', kind: 'info' },
  2: { label: '执行中', kind: 'info' },
  3: { label: '完毕', kind: 'success' },
  4: { label: '终止', kind: 'danger' },
  5: { label: '作废', kind: 'danger' },
};
const P_STATUS: Record<number, { label: string; kind: 'info' | 'success' | 'warning' | 'danger' }> = {
  1: { label: '未收', kind: 'warning' },
  2: { label: '部分回款', kind: 'info' },
  3: { label: '已回款', kind: 'success' },
  4: { label: '逾期', kind: 'danger' },
  5: { label: '部分坏账', kind: 'danger' },
};

export function ContractDetailPage() {
  const { id } = useParams();
  const cid = Number(id);
  const navigate = useNavigate();
  const toast = useUI((s) => s.toast);
  const term = useTerm();
  const [tab, setTab] = useState('overview');

  const { data: c, isLoading } = useQuery({ queryKey: ['contract', cid], queryFn: () => contractsApi.get(cid) });
  const { data: payments = [] } = useQuery({ queryKey: ['c-payments', cid], queryFn: () => contractsApi.payments(cid) });
  const { data: invoices = [] } = useQuery({ queryKey: ['c-invoices', cid], queryFn: () => contractsApi.invoices(cid) });

  if (isLoading) return <Card className="p-6"><TableSkeleton rows={6} cols={3} /></Card>;
  if (!c) return <EmptyState title="合同不存在" />;

  const TABS = [
    { key: 'overview', label: '概览' },
    { key: 'payments', label: '回款计划', count: payments.length },
    { key: 'invoices', label: '发票', count: invoices.length },
    { key: 'renewal', label: '续约' },
    { key: 'tracking', label: '跟进' },
    { key: 'ai', label: 'AI 助手' },
  ];

  const renewSoon = c.renewType === 2 && daysUntil(c.expiredDate) <= 90;

  const paymentCols: Column<Payment>[] = [
    { key: 'type', header: '类型', render: (r) => term.name(r.type) },
    { key: 'planAmount', header: '计划金额', numeric: true, render: (r) => <MoneyText value={r.planAmount} /> },
    { key: 'receivedAmount', header: '实收', numeric: true, render: (r) => <MoneyText value={r.receivedAmount} /> },
    { key: 'outstandingAmount', header: '未收', numeric: true, render: (r) => <MoneyText value={r.outstandingAmount} className="text-warning" /> },
    { key: 'planDate', header: '预计回款日', numeric: true, render: (r) => formatDate(r.planDate) },
    { key: 'status', header: '状态', render: (r) => <StatusTag {...P_STATUS[r.status]} /> },
  ];
  const invoiceCols: Column<Invoice>[] = [
    { key: 'code', header: '发票号', render: (r) => <span className="text-primary">{r.code}</span> },
    { key: 'invoiceType', header: '种类', render: (r) => term.name(r.invoiceType) },
    { key: 'amount', header: '含税金额', numeric: true, render: (r) => <MoneyText value={r.amount} /> },
    { key: 'taxAmount', header: '税额', numeric: true, render: (r) => <MoneyText value={r.taxAmount} /> },
    { key: 'status', header: '状态', render: (r) => <StatusTag kind={r.status === 1 ? 'success' : r.status === 0 ? 'warning' : 'danger'} label={['待开票', '已生成', '红冲', '作废'][r.status]} /> },
  ];

  return (
    <div>
      <Card className="mb-4">
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-text">{c.name}</h1>
              <StatusTag {...C_STATUS[c.status]} />
              <ApprovalBadge approval={c.approval} />
            </div>
            <div className="mt-1 text-sm text-text-weak">{c.code} · {c.customerName} · 负责人 {userName(c.leaderId)}</div>
            <div className="mt-3 grid w-[460px] max-w-full grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-text-weak">合同金额</span><MoneyText value={c.amount} currency={c.currency} strong /></div>
              <div className="flex justify-between"><span className="text-text-weak">已回款</span><MoneyText value={c.receivedAmount} currency={c.currency} /></div>
              <div className="flex justify-between"><span className="text-text-weak">未回款</span><MoneyText value={c.outstandingAmount} currency={c.currency} className="text-warning" /></div>
              <div className="flex justify-between"><span className="text-text-weak">已开票</span><MoneyText value={c.invoiceAmount} currency={c.currency} /></div>
            </div>
            <div className="mt-3 w-[460px] max-w-full">
              <div className="mb-1 text-xs text-text-faint">收款进度</div>
              <ProgressBar value={Number(c.receivedRate)} height={10} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => toast('已打开新建回款计划', 'info')}><Wallet size={14} />建回款计划</Button>
            <Button onClick={() => toast('已登记回款', 'success')}><Wallet size={14} />登记回款</Button>
            <Button onClick={() => navigate('/invoices')}><Receipt size={14} />申请开票</Button>
            <Button variant="primary" onClick={() => toast('已发起续约：生成续约商机 + 分级待办', 'success')}><RefreshCw size={14} />发起续约</Button>
          </div>
        </div>
      </Card>

      {renewSoon && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-[#FEF3E0] px-4 py-2.5 text-sm text-warning">
          <RefreshCw size={15} />
          该合同为到期续约类型，将在到期前 90/60/30 天自动生成续约商机与分级待办（{daysUntil(c.expiredDate)} 天后到期）
        </div>
      )}

      <Card>
        <div className="px-4">
          <Tabs items={TABS} value={tab} onChange={setTab} className="border-0" />
        </div>
        <div className="p-5">
          {tab === 'overview' && (
            <Descriptions
              columns={3}
              items={[
                { label: '合同编号', value: c.code },
                { label: '关联报价', value: c.quotationId ? <span className="text-primary cursor-pointer" onClick={() => navigate(`/quotations/${c.quotationId}`)}>QT…{c.quotationId}</span> : '—' },
                { label: '合同类型', value: ['', '常规', '框架主', '框架子'][c.contractType] },
                { label: '续约类型', value: c.renewType === 2 ? '到期续约' : '一次性' },
                { label: '开始日期', value: formatDate(c.beginDate) },
                { label: '到期日期', value: formatDate(c.expiredDate) },
                { label: '毛利', value: <MoneyText value={c.grossProfit} /> },
                { label: '现金毛利', value: <MoneyText value={c.cashProfit} /> },
                { label: '坏账', value: <MoneyText value={c.badDebtsAmount} /> },
              ]}
            />
          )}
          {tab === 'payments' && <DataTable columns={paymentCols} data={payments} rowKey={(r) => r.paymentId} />}
          {tab === 'invoices' && <DataTable columns={invoiceCols} data={invoices} rowKey={(r) => r.invoiceId} />}
          {tab === 'renewal' && (
            c.renewType === 2 ? (
              <Timeline items={[
                { id: 1, title: '到期前 90 天', kind: 'info', meta: formatDate(c.expiredDate), body: '生成续约提醒（待办）' },
                { id: 2, title: '到期前 60 天', kind: 'warning', body: '生成续约商机' },
                { id: 3, title: '到期前 30 天', kind: 'danger', body: '升级提醒，推送负责人' },
              ]} />
            ) : <EmptyState title="一次性合同，无续约计划" />
          )}
          {tab === 'tracking' && <EmptyState title="暂无合同跟进记录" />}
          {tab === 'ai' && <div className="-m-5 h-[520px]"><AiPanel businessType={2} businessId={cid} /></div>}
        </div>
      </Card>
    </div>
  );
}
