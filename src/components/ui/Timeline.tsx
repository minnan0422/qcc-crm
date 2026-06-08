import { cn } from '@/lib/cn';

export interface TimelineItem {
  id: number | string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  body?: React.ReactNode;
  kind?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

const DOT: Record<string, string> = {
  info: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-text-faint',
};

// §4.3 跟进/动态时间线（承接 customer_tracking / *_dynamic）
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-5 pl-5">
      {items.map((it, i) => (
        <li key={it.id} className="relative">
          {i !== items.length - 1 && <span className="absolute -left-[13px] top-4 h-full w-px bg-border" />}
          <span
            className={cn(
              'absolute -left-[18px] top-1 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-surface',
              DOT[it.kind ?? 'info'],
            )}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-text">{it.title}</span>
            {it.meta && <span className="text-xs text-text-faint">{it.meta}</span>}
          </div>
          {it.body && <div className="mt-1 text-sm text-text-weak">{it.body}</div>}
        </li>
      ))}
    </ol>
  );
}
