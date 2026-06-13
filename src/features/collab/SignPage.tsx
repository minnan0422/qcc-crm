import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin, Navigation } from 'lucide-react';
import { signApi } from '@/api/crm';
import { useListQuery } from '@/hooks/useListQuery';
import { useUI } from '@/store/ui';
import { PageHeader, SearchInput } from '@/components/ui/PageHeader';
import { Button, UserCell } from '@/components/ui/primitives';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Tabs } from '@/components/ui/Tabs';
import { StatusTag } from '@/components/ui/StatusTag';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Select, TextArea, TextInput } from '@/components/ui/form';
import { formatDateTime } from '@/lib/format';
import type { Sign } from '@/types';

export function SignPage() {
  const q = useListQuery<Sign>('sign', signApi.list, { defaultTab: 'mine', pageSize: 30 });
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const toast = useUI((s) => s.toast);

  const [type, setType] = useState('2');
  const [address, setAddress] = useState('');
  const [remark, setRemark] = useState('');
  const [geo, setGeo] = useState<{ lng?: number; lat?: number }>({});

  const locate = () => {
    if (!navigator.geolocation) return toast('当前环境不支持定位', 'error');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeo({ lng: p.coords.longitude, lat: p.coords.latitude });
        toast('定位成功', 'success');
      },
      () => toast('定位失败，请手动填写地址', 'error'),
    );
  };

  const submit = async () => {
    await signApi.create({ type: Number(type) as 1 | 2, address, remark, longitude: geo.lng, latitude: geo.lat });
    qc.invalidateQueries({ queryKey: ['sign'] });
    toast('签到成功', 'success');
    setOpen(false);
    setAddress('');
    setRemark('');
    setGeo({});
  };

  const columns: Column<Sign>[] = [
    { key: 'type', header: '类型', render: (r) => <StatusTag kind={r.type === 1 ? 'neutral' : 'info'} label={r.type === 1 ? '上下班' : '外勤拜访'} dot={false} /> },
    { key: 'userName', header: '员工', render: (r) => <UserCell name={r.userName} /> },
    { key: 'customerName', header: '客户', render: (r) => r.customerName ?? '—' },
    { key: 'address', header: '位置', render: (r) => (
      <span className="inline-flex items-center gap-1 text-text-weak"><MapPin size={13} className="text-primary" />{r.address ?? '—'}</span>
    ) },
    { key: 'remark', header: '备注', render: (r) => <span className="text-text-weak">{r.remark ?? '—'}</span> },
    { key: 'createDate', header: '时间', numeric: true, render: (r) => formatDateTime(r.createDate) },
  ];

  return (
    <div>
      <PageHeader
        title="外勤签到"
        description="上下班 / 外勤拜访打卡，支持定位"
        extra={
          <>
            <SearchInput value={q.keyword} onChange={q.setKeyword} placeholder="搜索客户 / 地址" />
            <Button variant="primary" onClick={() => setOpen(true)}><MapPin size={14} />签到</Button>
          </>
        }
      />
      <div className="mb-3">
        <Tabs items={[{ key: 'mine', label: '我的签到' }, { key: 'team', label: '团队签到' }]} value={q.tab} onChange={q.setTab} className="border-0" />
      </div>
      <DataTable
        columns={columns}
        data={q.data}
        rowKey={(r) => r.signId}
        loading={q.isLoading}
        error={q.isError}
        onRetry={q.refetch}
        pagination={{ page: q.page, pageSize: q.pageSize, total: q.total, onChange: q.setPage }}
      />

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="签到"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button variant="primary" onClick={submit}>提交签到</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="签到类型">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="2">外勤拜访</option>
              <option value="1">上下班</option>
            </Select>
          </Field>
          <Field label="位置">
            <div className="flex gap-2">
              <TextInput value={address} onChange={(e) => setAddress(e.target.value)} placeholder="当前地址" />
              <Button onClick={locate}><Navigation size={14} />定位</Button>
            </div>
          </Field>
          {geo.lat != null && <p className="text-xs text-text-faint">经纬度：{geo.lng?.toFixed(4)}, {geo.lat?.toFixed(4)}</p>}
          <Field label="备注">
            <TextArea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="拜访内容 / 备注" />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
