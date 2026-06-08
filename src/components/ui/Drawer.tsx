import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

// §4.3 右侧抽屉详情（列表内快速查看，不跳页）
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  width = 'w-[760px]',
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  width?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 animate-fade" onClick={onClose} />
      <div className={cn('relative z-10 flex h-full max-w-[92vw] flex-col bg-surface shadow-2xl animate-drawer', width)}>
        <div className="flex items-start justify-between border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-text">{title}</div>
            {subtitle && <div className="mt-0.5 text-sm text-text-weak">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-text-faint hover:bg-bg hover:text-text">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
        {footer && <div className="border-t border-border px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
