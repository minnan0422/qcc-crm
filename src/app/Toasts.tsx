import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useUI } from '@/store/ui';

const ICON = {
  success: <CheckCircle2 size={16} className="text-success" />,
  error: <XCircle size={16} className="text-danger" />,
  info: <Info size={16} className="text-primary" />,
};

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text shadow-lg animate-fade"
        >
          {ICON[t.kind]}
          {t.message}
        </div>
      ))}
    </div>
  );
}
