import { StatusTag } from './StatusTag';
import type { ApprovalStatus, StatusKind } from '@/types';

// §9.5 审批语义：-2无状态 -1未发起 0不需审批 2进行中 3驳回 4撤回 11通过
const MAP: Record<number, { label: string; kind: StatusKind }> = {
  [-2]: { label: '无状态', kind: 'neutral' },
  [-1]: { label: '未发起', kind: 'neutral' },
  0: { label: '无需审批', kind: 'neutral' },
  2: { label: '审批中', kind: 'warning' },
  3: { label: '已驳回', kind: 'danger' },
  4: { label: '已撤回', kind: 'neutral' },
  11: { label: '已通过', kind: 'success' },
};

export function ApprovalBadge({ approval }: { approval: ApprovalStatus | number }) {
  const m = MAP[approval] ?? MAP[-2];
  // 不需审批 / 无状态时不显示点
  return <StatusTag kind={m.kind} label={m.label} dot={approval === 2 || approval === 3 || approval === 11} />;
}
