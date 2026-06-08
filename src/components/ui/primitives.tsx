import { cn } from '@/lib/cn';

// ---------- Button ----------
type BtnVariant = 'primary' | 'default' | 'ghost' | 'danger';
type BtnSize = 'sm' | 'md';

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: 'bg-primary text-white hover:brightness-110 border-transparent',
  default: 'bg-surface text-text border-border hover:bg-bg',
  ghost: 'bg-transparent text-text-weak border-transparent hover:bg-bg',
  danger: 'bg-surface text-danger border-border hover:bg-[#FDECEC]',
};
const BTN_SIZE: Record<BtnSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1',
  md: 'h-9 px-3.5 text-sm gap-1.5',
};

export function Button({
  variant = 'default',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        BTN_VARIANT[variant],
        BTN_SIZE[size],
        className,
      )}
      {...props}
    />
  );
}

// ---------- Card ----------
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface shadow-card', className)}>{children}</div>
  );
}

export function CardHeader({
  title,
  extra,
  className,
}: {
  title: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between border-b border-border px-4 py-3', className)}>
      <h3 className="text-md font-semibold text-text">{title}</h3>
      {extra}
    </div>
  );
}

// ---------- Avatar ----------
const AVATAR_COLORS = ['#2A6FF0', '#15B077', '#F5A623', '#8B5CF6', '#E5484D', '#0EA5E9'];
export function Avatar({ name, size = 24 }: { name?: string; size?: number }) {
  const label = name?.slice(-2) ?? '?';
  const color = AVATAR_COLORS[(name?.length ?? 0) % AVATAR_COLORS.length];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
    >
      {label}
    </span>
  );
}

export function UserCell({ name }: { name?: string }) {
  if (!name || name === '—') return <span className="text-text-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Avatar name={name} size={22} />
      <span className="text-text">{name}</span>
    </span>
  );
}

// ---------- Badge（小数字徽标） ----------
export function CountBadge({ count, kind = 'danger' }: { count: number; kind?: 'danger' | 'primary' | 'neutral' }) {
  if (!count) return null;
  const cls =
    kind === 'danger' ? 'bg-danger text-white' : kind === 'primary' ? 'bg-primary text-white' : 'bg-bg text-text-weak';
  return (
    <span className={cn('inline-flex min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-4', cls)}>
      {count > 99 ? '99+' : count}
    </span>
  );
}
