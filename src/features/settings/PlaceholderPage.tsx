import { Construction } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/primitives';

// 协同办公 / 部分设置后台：给出接入位（§10.1），按五段式可继续补充
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Construction size={36} className="text-text-faint" />
        <p className="text-md font-medium text-text">{title} · 接入位已预留</p>
        <p className="max-w-md text-sm text-text-weak">
          本模块在重构文档中已给出主表与「五段式」规格位（§10.1），可按相同模式继续补充字段与交互。
        </p>
      </Card>
    </div>
  );
}
