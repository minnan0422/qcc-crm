import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

// 居中模态框（用于新建/编辑表单等）
export function Dialog({
  open,
  onClose,
  title,
  width = 'w-[560px]',
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh]">
      <div className="absolute inset-0 bg-black/30 animate-fade" onClick={onClose} />
      <div className={cn('relative z-10 flex max-h-[84vh] max-w-[94vw] flex-col rounded-xl border border-border bg-surface shadow-2xl animate-fade', width)}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="text-lg font-semibold text-text">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-text-faint hover:bg-bg hover:text-text">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
