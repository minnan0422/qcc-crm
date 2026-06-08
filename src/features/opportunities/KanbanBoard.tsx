import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GripVertical } from 'lucide-react';
import { opportunitiesApi } from '@/api/crm';
import { useTerm } from '@/hooks/useTerms';
import { useUI } from '@/store/ui';
import { TERMS_BIZ } from '@/mock/terms';
import { MoneyText } from '@/components/ui/MoneyText';
import { cn } from '@/lib/cn';
import { formatCompact } from '@/lib/money';
import { daysUntil } from '@/lib/format';
import { userName } from '@/mock/org';
import { Avatar } from '@/components/ui/primitives';
import type { Opportunity } from '@/types';

// §6.4 看板：泳道=opportunity_stage，卡片可拖拽改阶段（即时校验超时）
export function KanbanBoard({
  data,
  onCard,
}: {
  data: Opportunity[];
  onCard: (o: Opportunity) => void;
}) {
  const term = useTerm();
  const stages = term.options(TERMS_BIZ.oppStage);
  const qc = useQueryClient();
  const toast = useUI((s) => s.toast);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overStage, setOverStage] = useState<number | null>(null);

  const drop = async (stageId: number) => {
    if (dragId == null) return;
    const opp = data.find((o) => o.opportunityId === dragId);
    setOverStage(null);
    setDragId(null);
    if (!opp || opp.status === stageId) return;
    await opportunitiesApi.updateStage(dragId, stageId);
    qc.invalidateQueries({ queryKey: ['opportunities'] });
    const stageName = term.name(stageId);
    toast(`已将「${opp.name}」移动到「${stageName}」`, 'success');
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {stages.map((s) => {
        const cards = data.filter((o) => o.status === s.termId);
        const sum = cards.reduce((acc, c) => acc + Number(c.estimatedAmount), 0);
        return (
          <div
            key={s.termId}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(s.termId);
            }}
            onDrop={() => drop(s.termId)}
            className={cn(
              'flex w-72 shrink-0 flex-col rounded-lg border bg-bg/60',
              overStage === s.termId ? 'border-primary' : 'border-border',
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-sm font-medium text-text">
                <span className={cn('h-2 w-2 rounded-full', s.kind === 'success' ? 'bg-success' : s.kind === 'danger' ? 'bg-danger' : s.kind === 'warning' ? 'bg-warning' : 'bg-primary')} />
                {s.name}
                <span className="text-text-faint">{cards.length}</span>
              </span>
              <span className="text-xs text-text-weak">{formatCompact(String(sum))}</span>
            </div>
            <div className="flex flex-col gap-2 p-2">
              {cards.map((o) => {
                const overdue = daysUntil(o.statusExpiryDate) < 0;
                return (
                  <div
                    key={o.opportunityId}
                    draggable
                    onDragStart={() => setDragId(o.opportunityId)}
                    onClick={() => onCard(o)}
                    className="group cursor-pointer rounded-lg border border-border bg-surface p-2.5 shadow-card hover:border-primary/40"
                  >
                    <div className="flex items-start gap-1">
                      <GripVertical size={13} className="mt-0.5 shrink-0 text-text-faint opacity-0 group-hover:opacity-100" />
                      <span className="line-clamp-2 text-sm font-medium text-text">{o.name}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <MoneyText value={o.estimatedAmount} className="text-sm font-semibold text-text" />
                      <Avatar name={userName(o.leaderId)} size={20} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className="text-text-faint">停留 {o.allStayTime} 天</span>
                      {overdue && <span className="text-danger">阶段超时</span>}
                    </div>
                  </div>
                );
              })}
              {cards.length === 0 && <div className="py-6 text-center text-xs text-text-faint">拖拽商机到此</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
