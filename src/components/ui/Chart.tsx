import ReactECharts from 'echarts-for-react';

// ECharts 封装（漏斗/饼图/趋势，承接旧系统图表 §2）
export function Chart({ option, height = 280 }: { option: Record<string, unknown>; height?: number }) {
  return <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />;
}

// 统一调色板，取自 Design Token 语义色
export const CHART_COLORS = ['#2A6FF0', '#15B077', '#F5A623', '#8B5CF6', '#E5484D', '#0EA5E9', '#97A1B0'];
