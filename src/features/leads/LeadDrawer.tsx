import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, Phone } from 'lucide-react';
import { customersApi, leadsApi } from '@/api/crm';
import { Drawer } from '@/components/ui/Drawer';
import { Tabs } from '@/components/ui/Tabs';
import { Button, UserCell } from '@/components/ui/primitives';
import { Descriptions } from '@/components/ui/Descriptions';
import { TermTag, TermTags } from '@/components/ui/TermTag';
import { Timeline } from '@/components/ui/Timeline';
import { AiPanel } from '@/components/ai/AiPanel';
import { TableSkeleton } from '@/components/ui/states';
import { userName } from '@/mock/org';
import { formatDate, fromNow } from '@/lib/format';
import { useTerm } from '@/hooks/useTerms';
import type { Customer } from '@/types';

const TABS = [
  { key: 'overview', label: '概览' },
  { key: 'contacts', label: '联系人' },
  { key: 'tracking', label: '跟进' },
  { key: 'ai', label: 'AI 助手' },
];

export function LeadDrawer({
  id,
  onClose,
  onConvert,
}: {
  id: number;
  onClose: () => void;
  onConvert: (rows: Customer[]) => void;
}) {
  const [tab, setTab] = useState('overview');
  const term = useTerm();
  const { data: lead, isLoading } = useQuery({ queryKey: ['lead', id], queryFn: () => leadsApi.get(id) });

  return (
    <Drawer
      open
      onClose={onClose}
      title={lead?.name ?? '线索详情'}
      subtitle={lead && <TermTag id={lead.currentTrackingStatus} />}
      footer={
        lead && (
          <div className="flex justify-end gap-2">
            <Button variant="primary" onClick={() => onConvert([lead])}>
              <ArrowRightLeft size={14} />转为客户（保留跟进）
            </Button>
          </div>
        )
      }
    >
      <div className="px-5">
        <Tabs items={TABS} value={tab} onChange={setTab} className="sticky top-0 z-10 -mx-5 bg-surface px-5" />
      </div>
      {isLoading || !lead ? (
        <TableSkeleton rows={5} cols={2} />
      ) : (
        <div className="h-full p-5 pt-4">
          {tab === 'overview' && <OverviewTab lead={lead} />}
          {tab === 'contacts' && <ContactsTab customerId={id} />}
          {tab === 'tracking' && <TrackingTab customerId={id} />}
          {tab === 'ai' && (
            <div className="-m-5 h-[calc(100%+0px)]">
              <AiPanel businessType={0} businessId={id} />
            </div>
          )}
        </div>
      )}
    </Drawer>
  );

  function OverviewTab({ lead }: { lead: Customer }) {
    return (
      <Descriptions
        items={[
          { label: '线索名称', value: lead.name },
          { label: '企查查ID', value: lead.refCompanyId },
          { label: '线索来源', value: <TermTag id={lead.source} dot={false} /> },
          { label: '线索分组', value: <TermTag id={lead.poolGroup} dot={false} /> },
          { label: '行业', value: lead.industry },
          { label: '所在地区', value: `${lead.province ?? ''}${lead.city ?? ''}${lead.district ?? ''}` },
          { label: '联系人', value: <span className="inline-flex items-center gap-1.5">{lead.phoneName}<Phone size={12} className="text-primary" /></span> },
          { label: '电话', value: lead.phone },
          { label: '负责人', value: <UserCell name={userName(lead.leaderId)} /> },
          { label: '标签', value: <TermTags ids={lead.labels} /> },
          { label: '掉保计时', value: lead.loseTime ? fromNow(lead.loseTime) : '—' },
          { label: '创建时间', value: formatDate(lead.createDate) },
        ]}
      />
    );
  }
}

function ContactsTab({ customerId }: { customerId: number }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['contacts', customerId],
    queryFn: () => customersApi.contacts(customerId),
  });
  if (isLoading) return <TableSkeleton rows={3} cols={2} />;
  return (
    <div className="space-y-3">
      {data.map((c) => (
        <div key={c.contactId} className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text">{c.name}</span>
            {c.type === 1 && <span className="rounded bg-primary-weak px-1.5 py-0.5 text-xs text-primary">主联系人</span>}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-y-1.5 text-sm text-text-weak">
            <span>职位：{c.position}</span>
            <span>部门：{c.department}</span>
            <span>电话：{c.phone}</span>
            <span>微信：{c.wechat}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackingTab({ customerId }: { customerId: number }) {
  const term = useTerm();
  const { data = [], isLoading } = useQuery({
    queryKey: ['trackings', customerId],
    queryFn: () => customersApi.trackings(customerId),
  });
  if (isLoading) return <TableSkeleton rows={4} cols={1} />;
  if (data.length === 0) return <p className="py-8 text-center text-sm text-text-faint">暂无跟进记录</p>;
  return (
    <Timeline
      items={data.map((t) => ({
        id: t.trackingId,
        kind: t.priorityLevel === 2 ? 'neutral' : 'info',
        title: term.name(t.trackingType),
        meta: `${userName(t.createBy)} · ${formatDate(t.createDate, 'MM-DD HH:mm')}`,
        body: (
          <div>
            <p>{t.comment}</p>
            {t.nextTrackingDate && (
              <p className="mt-1 text-xs text-warning">下次跟进：{formatDate(t.nextTrackingDate)}</p>
            )}
          </div>
        ),
      }))}
    />
  );
}
