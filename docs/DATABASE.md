# NextCRM 业务数据库设计与优化（PostgreSQL 16）

本库基于前端领域模型（`src/types/index.ts`）与产品文档 §5 实体关系设计，**聚焦 L2C
核心链路**，不照搬旧系统 245 张遗留表，而是做规范化重建与针对性优化。

- DDL：`db/migrations/01..09_*.sql`
- 种子：`db/seed.sql`
- 一键起库：`cd db && docker compose up -d`（含 Adminer）
- 应用到已有库：`DATABASE_URL=postgres://crm:crm@host:5432/nextcrm ./db/apply.sh`

实测：34 张表 / 95 个索引，全部 migrations + seed 零错误执行；生成列与回写触发器、
关键索引命中均已通过 `EXPLAIN` 验证。

## 1. 模块与表

| 模块 | 表 |
|---|---|
| 组织 / RBAC（§9.1-9.2） | `organization` `department` `app_user` `role` `permission` `role_permission` `user_role` |
| 字典（§9.4） | `term` |
| 客户 / 线索（§6.2-6.3） | `customer`（线索与客户共表，category 区分） `contact` `customer_tracking` |
| 产品（§6.8） | `product_category` `product` `product_currency` |
| 商机（§6.4） | `opportunity` `opportunity_product` `opportunity_loss` |
| 报价（§6.5） | `quotation` `quotation_product` |
| 合同（§6.6） | `contract` `contract_product` `contract_renewal` |
| 资金（§6.7） | `payment` `payment_sheet` `payment_sheet_detail` `invoice` `invoice_detail` `pre_credit` |
| 待办 / 目标 / AI（§7-8） | `back_log` `target` `month_plan` `ai_prompt` `ai_report` `ai_report_chat` |

## 2. 关键设计决策

**金额一致性 —— GENERATED 列固化公式（核心优化）**
派生金额不落冗余、不靠应用层重算，由数据库表达式保证：
- `quotation.amount = round(total*order_discount_rate + other_charges - discount, 2)`，
  并据此派生 `gross_profit / gross_profit_rate / com_discount_rate`；
- `quotation_product.discount_price / total_price` 行内自动算；
- `contract.outstanding_amount / not_invoice_amount / received_rate`、
  `payment.outstanding_amount`、`invoice.no_tax_amount`、`target.achieve_rate` 同理。
> 对齐文档「金额字段后端已预计算、前端只读」（§5.2-3），且把口径写进 schema，杜绝前后端漂移。

**下游金额回写 —— 触发器（单一数据源）**
- 回款单 `payment_sheet`（未红冲）→ 汇总回写 `payment.received_amount` 与 `contract.received_amount`；
- 发票 `invoice`（蓝票、已生成）→ 汇总回写 `contract.invoice_amount`。
> 合同上的回款/开票额永远等于下游明细之和，删除/红冲自动回滚。

**可配置枚举 vs 固定枚举**
- 来源 / 阶段 / 状态 / 分级 / 跟进方式等可由企业自定义 → 统一 `term` 字典 + `*_term_id` 外键（§9.4）；
- 审批、category、合同/报价/发票状态等协议固定 → `smallint + CHECK`（或 `approval_status` DOMAIN）。

**多租户**：所有业务表带 `organization_id`，复合索引一律以其打头，天然支持按租户 + 数据范围过滤（§9.1）。

**部门树**：物化路径 `path`（如 `1,2,5`）+ `depth`，配 trgm 索引，用前缀匹配实现
`role.scope=3`「本部门及下属」而无需递归 CTE。

## 3. 索引与查询优化（均经 EXPLAIN 验证命中）

| 场景 | 索引 | 类型 |
|---|---|---|
| 列表切线索/客户 | `ix_customer_org_cat (org, category, active)` | 复合 B-tree |
| 名称模糊搜索 `ILIKE '%x%'` | `ix_*_name_trgm`（customer/opportunity/contract/product/user） | **GIN + pg_trgm** |
| 客户标签过滤 `labels && '{...}'` | `ix_customer_labels_gin` | **GIN（数组）** |
| 待续约扫描 | `ix_contract_renew` `WHERE renew_type=2 AND archive=false AND status IN(1,2)` | **部分索引** |
| 回款催收看板 | `ix_payment_collection (org, plan_date) WHERE status IN(1,2,4)` | **部分索引** |
| 商机阶段超时 | `ix_opp_status_expiry WHERE active=1` | 部分索引 |
| 我的待办 | `ix_backlog_user_open (user_id, deadline_date) WHERE status=0` | 部分索引 |
| 跟进时间线 | `ix_tracking_customer (customer_id, created_at DESC)` | 复合（含排序） |

设计取舍：
- **部分索引**只覆盖「未关闭/未完成/需扫描」的活跃行，索引更小、维护更省、扫描更快；
- **trgm GIN** 解决旧系统名称检索只能前缀匹配的问题，支持任意子串 `ILIKE`；
- 复合索引顺序遵循「等值列在前、范围/排序列在后」，并把 `organization_id` 作为最左前缀。

## 4. 完整性与可维护性
- 全外键约束 + 合理 `ON DELETE CASCADE`（子表随主表清理，如行项目、明细、对话）；
- `updated_at` 由统一触发器 `set_updated_at()` 维护；
- `approval_status` / `money_amt` 用 DOMAIN 复用，约束集中、语义清晰；
- 唯一约束：`(organization_id, code[, version])`、单客户唯一主联系人（部分唯一索引）。

## 5. 与前端 / 后端对接
- 字典 `term_id` 与前端常量（`src/mock/terms.ts`、`TERMS_BIZ`）一致，可直接替换 mock；
- 列表查询按 `organization_id` + `role.scope` 注入数据范围（§9.2）；
- 金额读取走生成列/回写列（只读），写操作只更新基础列，触发器与生成列自动维护派生值。

## 6. 后续可扩展
- 大表（customer / customer_tracking / payment_sheet）可按 `organization_id` 或时间做分区；
- 行级安全（RLS）按 `organization_id` 强制租户隔离；
- 审批流（work_flow_*）、公海规则（pool / pool_rule）、外勤（sign）、工单等按同样范式补表。
