import { useState } from 'react';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';

// §4.3 MoneyText：decimal 金额格式化 + 权限脱敏（脱敏 hover 提示「无权限查看」）
export function MoneyText({
  value,
  currency = 'CNY',
  masked = false,
  className,
  strong = false,
}: {
  value: string | number | undefined | null;
  currency?: string;
  masked?: boolean;
  className?: string;
  strong?: boolean;
}) {
  const [hover, setHover] = useState(false);
  if (masked) {
    return (
      <span
        className={cn('tabular-nums inline-flex items-center gap-1 text-text-faint cursor-not-allowed', className)}
        title="无权限查看"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {hover ? <Eye size={12} /> : null}
        ****
      </span>
    );
  }
  return (
    <span className={cn('tabular-nums', strong && 'font-semibold text-text', className)}>
      {formatMoney(value, currency)}
    </span>
  );
}
