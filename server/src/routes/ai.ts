import { Router } from 'express';
import { one } from '../db.js';
import { ah, ctx, fail, ok } from '../http.js';

export const aiRouter = Router();

// 结构化分析内容（基于真实库数据；生产可替换为调用大模型 + ai_prompt）
async function buildContent(businessType: number, businessId: number, orgId: number) {
  if (businessType === 3) {
    const o = await one<any>(
      `SELECT o.*, c.name customer_name FROM opportunity o LEFT JOIN customer c ON c.customer_id=o.customer_id
       WHERE o.opportunity_id=$1 AND o.organization_id=$2`,
      [businessId, orgId],
    );
    return {
      summary: `商机「${o?.name ?? ''}」预计成交 ¥${o?.estimated_amount ?? 0}，已停留 ${o?.all_stay_time ?? 0} 天，建议加快推进。`,
      points: [
        `客户：${o?.customer_name ?? '—'}`,
        `主推产品：${o?.main_product ?? '专业版套餐'}`,
        o?.competitor ? `存在竞品「${o.competitor}」，需差异化报价` : '暂无明确竞品',
      ],
      risks: [Number(o?.all_stay_time ?? 0) > 21 ? '阶段停留偏长，存在丢单风险' : '推进节奏正常'],
      suggestions: ['本周安排方案确认会议', '准备折扣预案并提交审批'],
      actionItems: [
        { id: 'a1', text: '预约客户决策人方案会议（3 日内）' },
        { id: 'a2', text: '整理竞品对比材料并发送客户' },
      ],
    };
  }
  if (businessType === 2) {
    const c = await one<any>(`SELECT * FROM contract WHERE contract_id=$1 AND organization_id=$2`, [businessId, orgId]);
    return {
      summary: `合同「${c?.name ?? ''}」金额 ¥${c?.amount ?? 0}，回款率 ${c?.received_rate ?? 0}%，未回款 ¥${c?.outstanding_amount ?? 0}。`,
      points: [`已回款 ¥${c?.received_amount ?? 0}`, `已开票 ¥${c?.invoice_amount ?? 0}`],
      risks: [Number(c?.outstanding_amount ?? 0) > 0 ? '存在未回款，关注回款计划' : '回款进度良好'],
      suggestions: ['核对回款计划与实际到账', '到期前 60 天启动续约'],
      actionItems: [{ id: 'a1', text: '催收未回款' }, { id: 'a2', text: '创建续约商机' }],
    };
  }
  const cust = await one<any>(`SELECT * FROM customer WHERE customer_id=$1 AND organization_id=$2`, [businessId, orgId]);
  return {
    summary: `${cust?.name ?? '该客户'}（${cust?.industry ?? '—'}），累计跟进 ${cust?.tracking_num ?? 0} 次。`,
    points: [`所在地区：${cust?.province ?? ''}${cust?.city ?? ''}`, '联系人信息齐全'],
    risks: [Number(cust?.tracking_num ?? 0) < 3 ? '跟进次数偏少' : '跟进密度正常'],
    suggestions: ['挖掘真实需求与预算', '推动建立商机'],
    actionItems: [{ id: 'a1', text: '安排需求挖掘电话' }, { id: 'a2', text: '发送产品资料与案例' }],
  };
}

aiRouter.post(
  '/ai/generate',
  ah(async (req, res) => {
    const { orgId } = ctx(req);
    const businessType = Number(req.body?.businessType);
    const businessId = Number(req.body?.businessId);
    const stageId = req.body?.stageId != null ? Number(req.body.stageId) : null;
    if (Number.isNaN(businessType) || Number.isNaN(businessId)) return fail(res, '缺少 businessType/businessId');

    const content = await buildContent(businessType, businessId, orgId);
    const row = await one<any>(
      `INSERT INTO ai_report (organization_id, business_type, business_id, stage_id, status, content)
       VALUES ($1,$2,$3,$4,2,$5) RETURNING *`,
      [orgId, businessType, businessId, stageId, JSON.stringify(content)],
    );
    ok(res, {
      reportId: row.report_id,
      businessType: row.business_type,
      businessId: row.business_id,
      stageId: row.stage_id ?? undefined,
      status: row.status,
      content,
      createDate: row.created_at,
    });
  }),
);
