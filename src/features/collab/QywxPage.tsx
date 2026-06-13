import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { qywxApi } from '@/api/crm';
import { IS_API_MODE } from '@/api/auth';
import { useListQuery } from '@/hooks/useListQuery';
import { useUI } from '@/store/ui';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button, Card, CardHeader, UserCell } from '@/components/ui/primitives';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusTag } from '@/components/ui/StatusTag';
import { Field, Select, TextArea } from '@/components/ui/form';
import { MOCK_USERS, userName } from '@/mock/org';
import { formatDateTime } from '@/lib/format';
import type { QywxMessage } from '@/types';

export function QywxPage() {
  const q = useListQuery<QywxMessage>('qywx', qywxApi.list, { pageSize: 30 });
  const qc = useQueryClient();
  const toast = useUI((s) => s.toast);
  const [toUser, setToUser] = useState('');
  const [content, setContent] = useState('');

  const send = async () => {
    if (!content.trim()) return toast('请输入内容', 'error');
    await qywxApi.send(toUser ? Number(toUser) : null, content.trim());
    setContent('');
    qc.invalidateQueries({ queryKey: ['qywx'] });
    toast('消息已发送', 'success');
  };

  const columns: Column<QywxMessage>[] = [
    { key: 'toUserName', header: '接收人', render: (r) => (r.toUserId ? <UserCell name={r.toUserName ?? userName(r.toUserId)} /> : '全体') },
    { key: 'content', header: '内容' },
    { key: 'channel', header: '通道', render: (r) => <StatusTag kind={r.channel === 'wecom' ? 'success' : 'neutral'} label={r.channel === 'wecom' ? '企业微信' : '本地记录'} dot={false} /> },
    { key: 'status', header: '状态', render: (r) => <StatusTag kind={r.status === 1 ? 'success' : 'danger'} label={r.status === 1 ? '已发送' : '失败'} /> },
    { key: 'createDate', header: '时间', numeric: true, render: (r) => formatDateTime(r.createDate) },
  ];

  return (
    <div>
      <PageHeader title="企微协同" description="审批/工单/待办等通知推送企业微信；未配置企业凭据时落库留痕" />

      <div className="mb-4 grid grid-cols-[1fr_360px] gap-4">
        <Card>
          <CardHeader title="消息记录" />
          <div className="p-3">
            <DataTable
              columns={columns}
              data={q.data}
              rowKey={(r) => r.msgId}
              loading={q.isLoading}
              error={q.isError}
              onRetry={q.refetch}
              pagination={{ page: q.page, pageSize: q.pageSize, total: q.total, onChange: q.setPage }}
            />
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-sm font-medium text-text">对接状态</div>
            <div className="mt-2 text-sm text-text-weak">
              {IS_API_MODE ? '已连接后端；' : 'Mock 模式；'}企业微信
              {' '}
              <StatusTag kind="warning" label="未配置凭据（开发模拟）" dot={false} />
            </div>
            <p className="mt-2 text-xs text-text-faint">
              配置 WECOM_CORP_ID / AGENT_ID / SECRET 后，消息将真实推送企业微信应用。
            </p>
          </Card>
          <Card>
            <CardHeader title="发送测试消息" />
            <div className="space-y-3 p-4">
              <Field label="接收人">
                <Select value={toUser} onChange={(e) => setToUser(e.target.value)}>
                  <option value="">全体成员</option>
                  {MOCK_USERS.map((u) => <option key={u.userId} value={u.userId}>{u.name}</option>)}
                </Select>
              </Field>
              <Field label="内容">
                <TextArea value={content} onChange={(e) => setContent(e.target.value)} placeholder="输入要推送的内容" />
              </Field>
              <Button variant="primary" className="w-full" onClick={send}><Send size={14} />发送</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
