import { customers } from '@/api/crm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/primitives';
import { Chart, CHART_COLORS } from '@/components/ui/Chart';
import { useTerm } from '@/hooks/useTerms';
import { TERMS_BIZ } from '@/mock/terms';

export function LeadsAnalyticsPage() {
  const term = useTerm();
  const leads = customers.filter((c) => c.category <= 2);

  // 转化漏斗：线索 → 跟进中 → 已转换
  const total = leads.length;
  const following = leads.filter((l) => l.currentTrackingStatus === 18).length;
  const converted = leads.filter((l) => l.currentTrackingStatus === 17).length;

  const funnelOption = {
    color: CHART_COLORS,
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'funnel',
        left: '5%',
        width: '90%',
        label: { formatter: '{b}: {c}' },
        data: [
          { name: '全部线索', value: total },
          { name: '跟进中', value: following + converted },
          { name: '已转换', value: converted },
        ],
      },
    ],
  };

  // 来源分析
  const sources = term.options(TERMS_BIZ.source);
  const sourceOption = {
    color: CHART_COLORS,
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: sources.map((s) => s.name) },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'bar',
        barWidth: 28,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        data: sources.map((s) => leads.filter((l) => l.source === s.termId).length),
      },
    ],
  };

  return (
    <div>
      <PageHeader title="线索分析" description="转化漏斗 + 来源分析（opportunity_conversion_rate）" />
      <div className="mb-4 grid grid-cols-3 gap-4">
        <Stat label="线索总数" value={total} />
        <Stat label="转化中" value={following} />
        <Stat label="转化率" value={`${total ? ((converted / total) * 100).toFixed(1) : 0}%`} accent />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader title="线索转化漏斗" />
          <Chart option={funnelOption} />
        </Card>
        <Card>
          <CardHeader title="线索来源分析" />
          <Chart option={sourceOption} />
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-text-faint">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent ? 'text-primary' : 'text-text'}`}>{value}</div>
    </Card>
  );
}
