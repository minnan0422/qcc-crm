import type { AiReport, AiReportContent } from '@/types';
import { contracts, customers, opportunities } from './data';
import { formatCompact } from '@/lib/money';

// §8 AI 助手：按 business_type(0线索1客户2合同3商机)+business_id+stage_id 生成结构化分析
let rid = 1;

export function buildAiReport(
  businessType: 0 | 1 | 2 | 3,
  businessId: number,
  stageId?: number,
): AiReport {
  const content = generateContent(businessType, businessId, stageId);
  return {
    reportId: rid++,
    businessType,
    businessId,
    stageId,
    status: 2, // 成功
    content,
    createDate: new Date().toISOString(),
  };
}

function generateContent(
  businessType: 0 | 1 | 2 | 3,
  businessId: number,
  _stageId?: number,
): AiReportContent {
  if (businessType === 3) {
    const o = opportunities.find((x) => x.opportunityId === businessId);
    return {
      summary: `该商机「${o?.name ?? ''}」预计成交金额约 ${formatCompact(o?.estimatedAmount ?? '0')}，当前已停留 ${o?.allStayTime ?? 0} 天，建议加快推进。`,
      points: [
        '客户决策链已基本明确，关键决策人参与度较高',
        `主推产品：${o?.mainProduct ?? '专业版套餐'}，与客户需求匹配度高`,
        o?.competitor ? `存在竞品「${o.competitor}」竞争，需差异化报价` : '暂无明确竞品介入',
      ],
      risks: [
        o && o.allStayTime > 21 ? '阶段停留时间偏长，存在丢单风险' : '推进节奏正常',
        '客户预算尚未最终确认，需财务侧跟进',
      ],
      suggestions: [
        '本周内安排一次方案确认会议',
        '准备针对性折扣方案，提交审批预案',
        '补充成功案例增强客户信心',
      ],
      actionItems: [
        { id: 'a1', text: '预约客户决策人方案会议（3 日内）' },
        { id: 'a2', text: '整理竞品对比材料并发送客户' },
        { id: 'a3', text: '与财务确认折扣审批口径' },
      ],
    };
  }
  if (businessType === 2) {
    const c = contracts.find((x) => x.contractId === businessId);
    return {
      summary: `合同「${c?.name ?? ''}」金额 ${formatCompact(c?.amount ?? '0')}，回款率 ${c?.receivedRate ?? '0'}%，未回款 ${formatCompact(c?.outstandingAmount ?? '0')}。`,
      points: [
        `已回款 ${formatCompact(c?.receivedAmount ?? '0')}`,
        `已开票 ${formatCompact(c?.invoiceAmount ?? '0')}`,
        c?.renewType === 2 ? '该合同为到期续约类型，建议提前布局续约' : '一次性合同',
      ],
      risks: [
        Number(c?.outstandingAmount ?? 0) > 0 ? '存在未回款金额，关注回款计划执行' : '回款进度良好',
      ],
      suggestions: ['核对回款计划与实际到账', '到期前 60 天启动续约商机'],
      actionItems: [
        { id: 'a1', text: '催收未回款并更新回款计划' },
        { id: 'a2', text: '创建续约商机' },
      ],
    };
  }
  // 0 线索 / 1 客户
  const cust = customers.find((x) => x.customerId === businessId);
  return {
    summary: `${cust?.name ?? '该客户'} 所属「${cust?.industry ?? '—'}」行业，累计跟进 ${cust?.trackingNum ?? 0} 次，当前处于培育/转化阶段。`,
    points: [
      `所在地区：${cust?.province ?? ''}${cust?.city ?? ''}`,
      `来源渠道明确，画像完整度较高`,
      '联系人信息齐全，主联系人已建立',
    ],
    risks: [
      (cust?.trackingNum ?? 0) < 3 ? '跟进次数偏少，关系尚浅' : '跟进密度正常',
      '尚未识别明确采购预算与时间窗口',
    ],
    suggestions: ['挖掘真实需求与预算', '推动建立商机', '邀约产品演示'],
    actionItems: [
      { id: 'a1', text: '安排一次需求挖掘电话' },
      { id: 'a2', text: '发送产品资料与案例' },
      { id: 'a3', text: '评估是否创建商机' },
    ],
  };
}
