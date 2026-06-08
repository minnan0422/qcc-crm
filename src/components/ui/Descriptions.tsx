import { cn } from '@/lib/cn';

export function Descriptions({
  items,
  columns = 2,
  className,
}: {
  items: { label: string; value: React.ReactNode }[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <dl
      className={cn('grid gap-x-6 gap-y-3.5', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}
    >
      {items.map((it, i) => (
        <div key={i} className="flex flex-col gap-1">
          <dt className="text-xs text-text-faint">{it.label}</dt>
          <dd className="text-sm text-text">{it.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
