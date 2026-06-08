import { trackings } from '@/mock/data';
import { MOCK_USERS, userName } from '@/mock/org';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/primitives';
import { Chart, CHART_COLORS } from '@/components/ui/Chart';

export function ActivityAnalyticsPage() {
  // 过程量：跟进量按人统计（customer_tracking）+ 外勤签到（sign，模拟）
  const byUser = MOCK_USERS.map((u) => ({
    name: u.name,
    tracking: trackings.filter((t) => t.createBy === u.userId).length,
    sign: ((u.userId * 7) % 13) + 2,
  }));

  const option = {
    color: CHART_COLORS,
    tooltip: { trigger: 'axis' },
    legend: { data: ['跟进量', '签到量'], top: 0 },
    grid: { left: 40, right: 20, top: 36, bottom: 30 },
    xAxis: { type: 'category', data: byUser.map((u) => u.name) },
    yAxis: { type: 'value' },
    series: [
      { name: '跟进量', type: 'bar', barWidth: 18, itemStyle: { borderRadius: [4, 4, 0, 0] }, data: byUser.map((u) => u.tracking) },
      { name: '签到量', type: 'bar', barWidth: 18, itemStyle: { borderRadius: [4, 4, 0, 0] }, data: byUser.map((u) => u.sign) },
    ],
  };

  return (
    <div>
      <PageHeader title="过程量" description="外勤签到（sign）+ 跟进量（customer_tracking）按人/部门统计" />
      <div className="mb-4 grid grid-cols-3 gap-4">
        <Stat label="本月跟进总量" value={trackings.length} />
        <Stat label="人均跟进" value={(trackings.length / MOCK_USERS.length).toFixed(1)} />
        <Stat label="活跃员工" value={MOCK_USERS.length} />
      </div>
      <Card>
        <CardHeader title="按员工过程量" />
        <Chart option={option} height={340} />
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-text-faint">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-text">{value}</div>
    </Card>
  );
}
