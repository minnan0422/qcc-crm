import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Term } from '@/types';

// §4.3 商机/合同阶段进度条，可点击切换阶段
export function StageStepper({
  stages,
  current,
  onChange,
}: {
  stages: Term[];
  current: number;
  onChange?: (termId: number) => void;
}) {
  const currentIdx = stages.findIndex((s) => s.termId === current);
  return (
    <div className="flex items-center">
      {stages.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const isFail = s.kind === 'danger';
        return (
          <div key={s.termId} className="flex flex-1 items-center last:flex-none">
            <button
              onClick={() => onChange?.(s.termId)}
              className="flex flex-col items-center gap-1.5"
              title={s.name}
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  done && 'bg-success text-white',
                  active && !isFail && 'bg-primary text-white',
                  active && isFail && 'bg-danger text-white',
                  !done && !active && 'bg-bg text-text-faint',
                )}
              >
                {done ? <Check size={14} /> : i + 1}
              </span>
              <span className={cn('whitespace-nowrap text-xs', active ? 'font-medium text-text' : 'text-text-weak')}>
                {s.name}
              </span>
            </button>
            {i < stages.length - 1 && (
              <span className={cn('mx-2 h-px flex-1', i < currentIdx ? 'bg-success' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
