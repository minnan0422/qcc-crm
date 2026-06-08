import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Briefcase, Handshake, Plus, Search, Settings, User, Users } from 'lucide-react';
import { searchApi, type SearchHit } from '@/api/crm';
import { QUICK_CREATE } from './nav';
import { useUI } from '@/store/ui';
import { cn } from '@/lib/cn';

const GROUP_ICON: Record<string, React.ReactNode> = {
  客户: <Users size={15} className="text-primary" />,
  商机: <Briefcase size={15} className="text-warning" />,
  合同: <Handshake size={15} className="text-success" />,
  联系人: <User size={15} className="text-text-weak" />,
};

// §3.2 CommandPalette（⌘K）：跨实体搜索 + 快捷新建 + 跳转设置
export function CommandPalette() {
  const open = useUI((s) => s.commandOpen);
  const setOpen = useUI((s) => s.setCommandOpen);
  const [kw, setKw] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (!open) setKw('');
  }, [open]);

  const { data: hits = [] } = useQuery({
    queryKey: ['search', kw],
    queryFn: () => searchApi.query(kw),
    enabled: open,
  });

  if (!open) return null;

  const grouped = hits.reduce<Record<string, SearchHit[]>>((acc, h) => {
    (acc[h.group] ??= []).push(h);
    return acc;
  }, {});

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/30 animate-fade" />
      <div
        className="relative z-10 w-[620px] max-w-[92vw] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-fade"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search size={18} className="text-text-faint" />
          <input
            autoFocus
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder="搜索客户 / 商机 / 合同 / 联系人，或执行操作…"
            className="h-12 flex-1 bg-transparent text-md outline-none placeholder:text-text-faint"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-text-faint">Esc</kbd>
        </div>

        <div className="max-h-[52vh] overflow-auto p-2">
          {!kw && (
            <Group title="快捷新建">
              {QUICK_CREATE.map((q) => (
                <Row key={q.label} icon={<Plus size={15} className="text-primary" />} title={q.label} onClick={() => go(q.path)} />
              ))}
              <Row icon={<Settings size={15} className="text-text-weak" />} title="跳转设置" onClick={() => go('/settings')} />
            </Group>
          )}

          {kw && hits.length === 0 && (
            <div className="py-10 text-center text-sm text-text-faint">未找到与「{kw}」相关的结果</div>
          )}

          {Object.entries(grouped).map(([group, items]) => (
            <Group key={group} title={group}>
              {items.map((h) => (
                <Row
                  key={h.group + h.id}
                  icon={GROUP_ICON[h.group]}
                  title={h.title}
                  subtitle={h.subtitle}
                  onClick={() => go(h.path)}
                />
              ))}
            </Group>
          ))}
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="px-2 py-1 text-xs font-medium text-text-faint">{title}</div>
      {children}
    </div>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn('group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-bg')}
    >
      {icon}
      <span className="flex-1 truncate text-sm text-text">{title}</span>
      {subtitle && <span className="truncate text-xs text-text-faint">{subtitle}</span>}
      <ArrowRight size={14} className="text-text-faint opacity-0 group-hover:opacity-100" />
    </button>
  );
}
