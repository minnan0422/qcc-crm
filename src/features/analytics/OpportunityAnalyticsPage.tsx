import { useMemo, useState } from 'react';
import { CalendarPlus, Send, UserCog } from 'lucide-react';
import { opportunities } from '@/api/crm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/primitives';
import { Chart, CHART_COLORS } from '@/components/ui/Chart';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { MoneyText } from '@/components/ui/MoneyText';
import { TermTag } from '@/components/ui/TermTag';
import { useTerm } from '@/hooks/useTerms';
import { useUI } from '@/store/ui';
import { TERMS_BIZ } from '@/mock/terms';
import { userName } from '@/mock/org';
import { daysFromNow } from '@/lib/format';
import { formatCompact } from '@/lib/money';
import { cn } from '@/lib/cn';
import type { Opportunity } from '@/types';

type Insight = { key: string; label: string; filter: (o: Opportunity) => boolean };

const INSIGHTS: Insight[] = [
  { key: 'no7', label: '7 天以上无跟进', filter: (o) => daysFromNow(o.statusExpiryDate) >= 7 && o.status < 34 },
  { key: 'no14', label: '14 天以上无跟进', filter: (o) => daysFromNow(o.statusExpiryDate) >= 14 && o.status < 34 },
  { key: 'no30', label: '30 天以上无跟进', filter: (o) => daysFromNow(o.statusExpiryDate) >= 30 && o.status < 34 },
  { key: 'stay30', label: '停留时长 ≥ 30 天', filter: (o) => o.allStayTime >= 30 && o.status < 34 },
  { key: 'overdue', label: '阶段停留超时', filter: (o) => daysFromNow(o.statusExpiryDate) > 0 && o.status < 34 },
  { key: 'bigOpen', label: '大额未赢单(≥50万)', filter: (o) => Number(o.estimatedAmount) >= 500000 && o.status < 34 },
];

export function OpportunityAnalyticsPage() {
  const term = useTerm();
  const toast = useUI((s) => s.toast);
  const [active, setActive] = useState<Insight | null>(null);
  const stages = term.options(TERMS_BIZ.oppStage).filter((s) => s.kind !== 'danger');

  // 阶段漏斗
  const funnel = useMemo(
    () =>
      stages.map((s) => ({
        name: s.name,
        value: opportunities.filter((o) => o.status === s.termId).length,
        amount: opportunities.filter((o) => o.status === s.termId).reduce((acc, o) => acc + Number(o.estimatedAmount), 0),
      })),
    [stages],
  );

  // 健康度饼图：无跟进分布
  const healthBuckets = [
    { name: '正常(<7天)', value: opportunities.filter((o) => daysFromNow(o.statusExpiryDate) < 7).length },
    { name: '7-14天', value: opportunities.filter((o) => { const x = daysFromNow(o.statusExpiryDate); return x >= 7 && x < 14; }).length },
    { name: '14-21天', value: opportunities.filter((o) => { const x = daysFromNow(o.statusExpiryDate); return x >= 14 && x < 21; }).length },
    { name: '21-30天', value: opportunities.filter((o) => { const x = daysFromNow(o.statusExpiryDate); return x >= 21 && x < 30; }).length },
    { name: '≥30天', value: opportunities.filter((o) => daysFromNow(o.statusExpiryDate) >= 30).length },
  ];

  const funnelOption = {
    color: CHART_COLORS,
    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}<br/>数量：${p.value} 个` },
    series: [
      {
        type: 'funnel',
        left: '5%',
        width: '90%',
        label: { formatter: '{b}: {c}' },
        data: funnel.map((f) => ({ name: f.name, value: f.value })),
      },
    ],
  };

  const pieOption = {
    color: CHART_COLORS,
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '44%'],
        label: { show: true, formatter: '{b}\n{c}' },
        data: healthBuckets,
      },
    ],
  };

  const filtered = active ? opportunities.filter(active.filter) : [];

  const writeBacklog = (rows: Opportunity[]) =>
    toast(`已为 ${rows.length} 个高风险商机的负责人写入待办（business_type=70）`, 'success');

  const columns: Column<Opportunity>[] = [
    { key: 'name', header: '商机名称', render: (r) => <span className="font-medium text-primary">{r.name}</span> },
    { key: 'customerName', header: '客户' },
    { key: 'estimatedAmount', header: '预计金额', numeric: true, render: (r) => <MoneyText value={r.estimatedAmount} /> },
    { key: 'status', header: '阶段', render: (r) => <TermTag id={r.status} /> },
    { key: 'allStayTime', header: '停留天数', numeric: true, render: (r) => `${r.allStayTime} 天` },
    { key: 'leaderId', header: '负责人', render: (r) => userName(r.leaderId) },
  ];

  return (
    <div>
      <PageHeader title="商机分析" description="洞察可一键转动作：跳转列表 → 批量指派/建计划/提醒 → 写入待办" />

      <div className="mb-4 grid grid-cols-2 gap-4">
        <Card>
          <CardHeader title="阶段漏斗" />
          <Chart option={funnelOption} />
        </Card>
        <Card>
          <CardHeader title="跟进健康度（无跟进分布）" />
          <Chart option={pieOption} />
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader title="风险洞察 · 点击查看并批量处理" />
        <div className="grid grid-cols-3 gap-3 p-4">
          {INSIGHTS.map((ins) => {
            const count = opportunities.filter(ins.filter).length;
            const isActive = active?.key === ins.key;
            return (
              <button
                key={ins.key}
                onClick={() => setActive(isActive ? null : ins)}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3 text-left transition-colors',
                  isActive ? 'border-primary bg-primary-weak' : 'border-border hover:border-primary/40',
                )}
              >
                <span className="text-sm text-text">{ins.label}</span>
                <span className={cn('text-xl font-semibold', count > 0 ? 'text-danger' : 'text-text-faint')}>{count}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {active && (
        <Card>
          <CardHeader
            title={
              <span>
                {active.label} · 共 {filtered.length} 个 · 合计{' '}
                {formatCompact(String(filtered.reduce((s, o) => s + Number(o.estimatedAmount), 0)))}
              </span>
            }
          />
          <div className="p-3">
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(r) => r.opportunityId}
              selectable
              bulkActions={[
                { label: '指派跟进', icon: <UserCog size={13} />, onClick: (rows) => toast(`已指派 ${rows.length} 个商机`, 'success') },
                { label: '建跟进计划', icon: <CalendarPlus size={13} />, onClick: (rows) => toast(`已为 ${rows.length} 个商机创建跟进计划`, 'success') },
                { label: '提醒负责人(写入待办)', icon: <Send size={13} />, onClick: writeBacklog },
              ]}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
