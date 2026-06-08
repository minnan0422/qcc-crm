import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NAV_GROUPS } from './nav';
import { useUI } from '@/store/ui';

// §3.2 SideNav：分组可折叠、记忆折叠状态
export function SideNav() {
  const collapsed = useUI((s) => s.navCollapsed);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('crm.openGroups');
    if (saved) return JSON.parse(saved);
    return Object.fromEntries(NAV_GROUPS.map((g) => [g.group, !g.defaultCollapsed]));
  });

  const toggle = (group: string) => {
    const next = { ...openGroups, [group]: !openGroups[group] };
    setOpenGroups(next);
    localStorage.setItem('crm.openGroups', JSON.stringify(next));
  };

  return (
    <nav
      className={cn(
        'flex shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-surface py-3 transition-all',
        collapsed ? 'w-[60px] px-2' : 'w-[208px] px-3',
      )}
    >
      {NAV_GROUPS.map((g) => {
        const open = openGroups[g.group] ?? true;
        return (
          <div key={g.group} className="mb-1">
            {!collapsed && (
              <button
                onClick={() => toggle(g.group)}
                className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-medium text-text-faint hover:text-text-weak"
              >
                {g.group}
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            )}
            {(open || collapsed) &&
              g.items.map((it) => (
                <NavLink
                  key={it.path}
                  to={it.path}
                  title={it.label}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-primary-weak font-medium text-primary'
                        : 'text-text-weak hover:bg-bg hover:text-text',
                    )
                  }
                >
                  <it.icon size={17} className="shrink-0" />
                  {!collapsed && <span className="truncate">{it.label}</span>}
                </NavLink>
              ))}
          </div>
        );
      })}
    </nav>
  );
}
