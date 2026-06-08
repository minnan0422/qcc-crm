import { productsApi } from '@/api/crm';
import { useListQuery } from '@/hooks/useListQuery';
import { PageHeader, SearchInput } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/primitives';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { MoneyText } from '@/components/ui/MoneyText';
import { StatusTag } from '@/components/ui/StatusTag';
import type { Product } from '@/types';

export function ProductsPage() {
  const q = useListQuery<Product>('products', productsApi.list);

  const columns: Column<Product>[] = [
    { key: 'code', header: '编号', render: (r) => <span className="text-text-faint">{r.code}</span> },
    { key: 'name', header: '产品名称', render: (r) => <span className="font-medium text-text">{r.name}</span> },
    { key: 'categoryName', header: '分类' },
    { key: 'spec', header: '规格' },
    { key: 'unit', header: '单位' },
    { key: 'timeLimits', header: '服务周期', render: (r) => (r.timeLimits ? `${r.timeLimits} 月` : '一次性') },
    { key: 'price', header: '标准价', numeric: true, sortable: true, render: (r) => <MoneyText value={r.price} /> },
    { key: 'cost', header: '成本', numeric: true, render: (r) => <MoneyText value={r.cost} className="text-text-weak" /> },
    { key: 'minDiscount', header: '最低折扣', numeric: true, render: (r) => r.minDiscount },
    { key: 'freePricing', header: '自由定价', render: (r) => (r.freePricing ? <StatusTag kind="warning" label="是" dot={false} /> : <span className="text-text-faint">否</span>) },
    { key: 'active', header: '状态', render: (r) => <StatusTag kind={r.active ? 'success' : 'neutral'} label={r.active ? '上架' : '下架'} /> },
  ];

  return (
    <div>
      <PageHeader
        title="产品管理"
        description="多级分类 · 多规格 · 多币种价 · 折扣约束（报价/商机/合同引用此目录）"
        extra={
          <>
            <SearchInput value={q.keyword} onChange={q.setKeyword} placeholder="搜索产品 / 编号" />
            <Button variant="primary" size="md">新建产品</Button>
          </>
        }
      />
      <DataTable
        columns={columns}
        data={q.data}
        rowKey={(r) => r.productId}
        loading={q.isLoading}
        error={q.isError}
        onRetry={q.refetch}
        sort={q.sort}
        onSortChange={q.setSort}
        pagination={{ page: q.page, pageSize: q.pageSize, total: q.total, onChange: q.setPage }}
      />
    </div>
  );
}
