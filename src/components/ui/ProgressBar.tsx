import { cn } from '@/lib/cn';

// 收款进度条（§6.6 头部 / 列表）
export function ProgressBar({ value, height = 8 }: { value: number; height?: number }) {
  const v = Math.min(100, Math.max(0, value));
  const color = v >= 100 ? 'bg-success' : v >= 50 ? 'bg-primary' : 'bg-warning';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 overflow-hidden rounded-full bg-bg" style={{ height }}>
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${v}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-text-weak">{v.toFixed(0)}%</span>
    </div>
  );
}
