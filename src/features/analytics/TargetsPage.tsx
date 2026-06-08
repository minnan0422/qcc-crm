import { useQuery } from '@tanstack/react-query';
import { targetsApi } from '@/api/crm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/primitives';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { MoneyText } from '@/components/ui/MoneyText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Chart, CHART_COLORS } from '@/components/ui/Chart';
import { userName } from '@/mock/org';
import { rate, sub, formatCompact } from '@/lib/money';
import { dayjs } from '@/lib/format';
import type { Target } from '@/types';

export function TargetsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['targets'], queryFn: () => targetsApi.list() });

  const totalTarget = data.reduce((s, t) => s + Number(t.targetAmount), 0);
  const totalFinished = data.reduce((s, t) => s + Number(t.finishedAmount), 0);

  const columns: Column<Target>[] = [
    { key: 'userId', header: '成员', render: (r) => userName(r.userId) },
    { key: 'targetAmount', header: '目标', numeric: true, render: (r) => <MoneyText value={r.targetAmount} /> },
    { key: 'finishedAmount', header: '完成', numeric: true, render: (r) => <MoneyText value={r.finishedAmount} /> },
    { key: 'newSignAmount', header: '新签', numeric: true, render: (r) => <MoneyText value={r.newSignAmount} /> },
    { key: 'renewAmount', header: '续签', numeric: true, render: (r) => <MoneyText value={r.renewAmount} /> },
    { key: 'gap', header: '缺口', numeric: true, render: (r) => <MoneyText value={sub(r.targetAmount, r.finishedAmount)} className="text-warning" /> },
    {
      key: 'achieve',
      header: '达成率',
      width: 150,
      render: (r) => <ProgressBar value={Number(rate(r.finishedAmount, r.targetAmount))} />,
    },
  ];

  const barOption = {
    color: CHART_COLORS,
    tooltip: { trigger: 'axis' },
    legend: { data: ['目标', '完成'], top: 0 },
    grid: { left: 50, right: 20, top: 36, bottom: 30 },
    xAxis: { type: 'category', data: data.map((t) => userName(t.userId)) },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${v / 10000}万` } },
    series: [
      { name: '目标', type: 'bar', barWidth: 16, data: data.map((t) => Number(t.targetAmount)) },
      { name: '完成', type: 'bar', barWidth: 16, data: data.map((t) => Number(t.finishedAmount)) },
    ],
  };

  return (
    <div>
      <PageHeader title={`目标管理 · ${dayjs().format('YYYY 年 M 月')}`} description="按用户/部门 + 合同额/回款额，目标/完成/缺口/达成率" />
      <div className="mb-4 grid grid-cols-3 gap-4">
        <Stat label="团队目标" value={formatCompact(String(totalTarget))} />
        <Stat label="已完成" value={formatCompact(String(totalFinished))} />
        <Stat label="整体达成率" value={`${rate(totalFinished, totalTarget)}%`} accent />
      </div>
      <Card className="mb-4">
        <CardHeader title="目标 vs 完成" />
        <Chart option={barOption} height={320} />
      </Card>
      <Card>
        <CardHeader title="成员明细" />
        <div className="p-3">
          <DataTable columns={columns} data={data} rowKey={(r) => r.targetId} loading={isLoading} />
        </div>
      </Card>
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
