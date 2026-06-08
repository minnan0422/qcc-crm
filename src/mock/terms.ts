import type { Term } from '@/types';

// §9.4 terms 字典 —— 前端禁止写死枚举，统一从此翻译
// businessType: 1来源 2商机阶段 3客户状态 4线索状态 5线索阶段
//               6客户分类 7工单类型 8跟进方式 9线索无效原因
// 另用 100+ 承载本前端需要的扩展字典（分级/回款类型/发票种类等）
export const MOCK_TERMS: Term[] = [
  // 1 客户来源
  { termId: 1, businessType: 1, name: '官网注册', kind: 'info' },
  { termId: 2, businessType: 1, name: '广告投放', kind: 'info' },
  { termId: 3, businessType: 1, name: '转介绍', kind: 'info' },
  { termId: 4, businessType: 1, name: '陌拜', kind: 'info' },
  { termId: 5, businessType: 1, name: '展会', kind: 'info' },
  { termId: 6, businessType: 1, name: '企查查导入', kind: 'info' },

  // 2 商机阶段（opportunity.status）
  { termId: 30, businessType: 2, name: '需求沟通', kind: 'info', order: 1 },
  { termId: 31, businessType: 2, name: '方案评估', kind: 'info', order: 2 },
  { termId: 32, businessType: 2, name: '报价阶段', kind: 'info', order: 3 },
  { termId: 33, businessType: 2, name: '签约流程中', kind: 'warning', order: 4 },
  { termId: 34, businessType: 2, name: '赢单', kind: 'success', order: 5 },
  { termId: 35, businessType: 2, name: '输单', kind: 'danger', order: 6 },

  // 3 客户状态（customer.current_tracking_status，8初访…14已回款）
  { termId: 8, businessType: 3, name: '初访', kind: 'info' },
  { termId: 9, businessType: 3, name: '意向', kind: 'info' },
  { termId: 10, businessType: 3, name: '方案', kind: 'info' },
  { termId: 11, businessType: 3, name: '谈判', kind: 'warning' },
  { termId: 12, businessType: 3, name: '已签约', kind: 'success' },
  { termId: 13, businessType: 3, name: '已开票', kind: 'success' },
  { termId: 14, businessType: 3, name: '已回款', kind: 'success' },

  // 4 线索状态（15未分配/16待处理/17已转换/18跟进中/19无效）
  { termId: 15, businessType: 4, name: '未分配', kind: 'neutral' },
  { termId: 16, businessType: 4, name: '待处理', kind: 'warning' },
  { termId: 18, businessType: 4, name: '跟进中', kind: 'info' },
  { termId: 17, businessType: 4, name: '已转换', kind: 'success' },
  { termId: 19, businessType: 4, name: '无效', kind: 'danger' },

  // 8 跟进方式
  { termId: 80, businessType: 8, name: '电话', kind: 'info' },
  { termId: 81, businessType: 8, name: '微信', kind: 'info' },
  { termId: 82, businessType: 8, name: '拜访', kind: 'info' },
  { termId: 83, businessType: 8, name: '邮件', kind: 'info' },
  { termId: 84, businessType: 8, name: '线上会议', kind: 'info' },

  // 9 线索无效原因
  { termId: 90, businessType: 9, name: '空号/无法联系', kind: 'danger' },
  { termId: 91, businessType: 9, name: '无采购需求', kind: 'danger' },
  { termId: 92, businessType: 9, name: '同行/竞品', kind: 'danger' },
  { termId: 93, businessType: 9, name: '预算不足', kind: 'danger' },

  // 100 客户分级（25A/26B/27C）
  { termId: 25, businessType: 100, name: 'A 级', kind: 'success' },
  { termId: 26, businessType: 100, name: 'B 级', kind: 'info' },
  { termId: 27, businessType: 100, name: 'C 级', kind: 'neutral' },

  // 101 线索分组
  { termId: 101, businessType: 101, name: '高潜', kind: 'success' },
  { termId: 102, businessType: 101, name: '常规', kind: 'info' },
  { termId: 103, businessType: 101, name: '待培育', kind: 'warning' },

  // 102 客户标签
  { termId: 110, businessType: 102, name: '重点客户', kind: 'danger' },
  { termId: 111, businessType: 102, name: '老客户', kind: 'success' },
  { termId: 112, businessType: 102, name: '新客户', kind: 'info' },
  { termId: 113, businessType: 102, name: '战略合作', kind: 'warning' },

  // 103 回款类型
  { termId: 120, businessType: 103, name: '保证金', kind: 'info' },
  { termId: 121, businessType: 103, name: '常规回款', kind: 'info' },
  { termId: 122, businessType: 103, name: '尾款', kind: 'warning' },
  { termId: 123, businessType: 103, name: '预付款', kind: 'info' },

  // 104 发票种类
  { termId: 130, businessType: 104, name: '增值税专票' },
  { termId: 131, businessType: 104, name: '增值税普票' },
  { termId: 132, businessType: 104, name: '电子专票' },
  { termId: 133, businessType: 104, name: '电子普票' },
  { termId: 134, businessType: 104, name: '收据' },

  // 105 支付方式
  { termId: 140, businessType: 105, name: '银行转账' },
  { termId: 141, businessType: 105, name: '支付宝' },
  { termId: 142, businessType: 105, name: '微信' },
  { termId: 143, businessType: 105, name: '承兑汇票' },
];

export const TERMS_BIZ = {
  source: 1,
  oppStage: 2,
  customerStatus: 3,
  leadStatus: 4,
  followType: 8,
  leadInvalid: 9,
  level: 100,
  poolGroup: 101,
  label: 102,
  paymentType: 103,
  invoiceType: 104,
  payMethod: 105,
} as const;
