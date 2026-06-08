import { Link } from 'react-router-dom';
import { Building2, FileCheck2, Languages, ListTree, Shield, SlidersHorizontal, Tags, Workflow } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/primitives';
import { useTermsMap } from '@/hooks/useTerms';

const ITEMS = [
  { icon: Building2, title: '组织 / 部门', desc: 'organization · department 部门树', path: '/settings' },
  { icon: Shield, title: '角色 / 权限', desc: 'role.scope 数据范围 + permission', path: '/settings' },
  { icon: SlidersHorizontal, title: '字段配置', desc: '列表列显隐 / 自定义字段', path: '/settings' },
  { icon: Workflow, title: '审批流', desc: 'work_flow_route / task / form', path: '/settings' },
  { icon: Tags, title: '字典管理', desc: 'terms 来源/阶段/状态/分类', path: '/settings' },
  { icon: ListTree, title: '产品目录', desc: 'product / category / 多币种', path: '/settings/products' },
  { icon: FileCheck2, title: '公海 / 线索池规则', desc: 'pool_rule 领取上限/掉保', path: '/settings' },
  { icon: Languages, title: '国际化 / 币种', desc: 'i18next 中英 + currency_setting', path: '/settings' },
];

export function SettingsPage() {
  const terms = useTermsMap();
  return (
    <div>
      <PageHeader title="设置" description="组织 / 角色 / 字段 / 审批流 / 字典 / 产品 —— 多租户与权限基座（§9）" />
      <div className="grid grid-cols-3 gap-4">
        {ITEMS.map((it) => (
          <Link key={it.title} to={it.path}>
            <Card className="flex items-start gap-3 p-4 transition-colors hover:border-primary/40">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-weak text-primary">
                <it.icon size={20} />
              </span>
              <div>
                <div className="text-md font-medium text-text">{it.title}</div>
                <div className="mt-0.5 text-sm text-text-weak">{it.desc}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="mt-4 p-4">
        <div className="text-sm font-medium text-text">已加载字典（terms）</div>
        <div className="mt-1 text-sm text-text-weak">
          当前组织共缓存 {terms.length} 条字典项，所有状态/来源/阶段标签均由此翻译，支持企业自定义。
        </div>
      </Card>
    </div>
  );
}
