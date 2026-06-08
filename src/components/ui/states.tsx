import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';

// §4.3 / §4.4 加载/空/错三件套 —— 所有页面必须接入
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4 w-full', className)} />;
}

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-5', c === 0 ? 'w-1/4' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title = '暂无数据',
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg text-text-faint">
        <Inbox size={26} />
      </div>
      <div>
        <p className="text-md font-medium text-text">{title}</p>
        {description && <p className="mt-1 text-sm text-text-weak">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDECEC] text-danger">
        <AlertTriangle size={26} />
      </div>
      <div>
        <p className="text-md font-medium text-text">加载失败</p>
        <p className="mt-1 text-sm text-text-weak">{message ?? '请稍后重试'}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-bg"
        >
          <RefreshCw size={14} /> 重试
        </button>
      )}
    </div>
  );
}
