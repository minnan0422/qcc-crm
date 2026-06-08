import { cn } from '@/lib/cn';
import type { StatusKind } from '@/types';

// §4.2 状态标签配色（全局统一）
const KIND_CLASS: Record<StatusKind, string> = {
  info: 'bg-primary-weak text-primary',
  success: 'bg-[#E7F7F0] text-success',
  warning: 'bg-[#FEF3E0] text-warning',
  danger: 'bg-[#FDECEC] text-danger',
  neutral: 'bg-[#EEF1F5] text-text-weak',
};

const KIND_DOT: Record<StatusKind, string> = {
  info: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-text-faint',
};

export function StatusTag({
  kind = 'neutral',
  label,
  dot = true,
  className,
}: {
  kind?: StatusKind;
  label: string;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        KIND_CLASS[kind],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', KIND_DOT[kind])} />}
      {label}
    </span>
  );
}
