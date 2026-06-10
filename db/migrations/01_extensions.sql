-- ============================================================
-- NextCRM · 业务数据库（PostgreSQL 16）
-- 01 扩展与通用约定
-- ------------------------------------------------------------
-- 设计原则（详见 docs/DATABASE.md）：
--  1) 金额一律 numeric(19,2)，禁用 float；派生金额用 GENERATED 列保证一致性
--  2) 时间统一 timestamptz；created_at/updated_at 由触发器维护
--  3) 多租户：所有业务表带 organization_id，复合索引以其打头
--  4) 可配置枚举（来源/阶段/状态…）走 term 字典 + FK；固定枚举用 smallint + CHECK
--  5) 软删除 active；名称检索用 pg_trgm
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- 名称模糊检索 GIN 索引
CREATE EXTENSION IF NOT EXISTS btree_gin; -- 复合 GIN（org_id + 数组/文本）

-- 统一的 updated_at 维护函数
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 审批状态语义（§9.5）：-2无状态 -1未发起 0不需审批 2进行中 3驳回 4撤回 11通过
-- 以可复用 DOMAIN 承载，避免每表重复 CHECK
CREATE DOMAIN approval_status AS smallint
  CHECK (VALUE IN (-2, -1, 0, 2, 3, 4, 11));

CREATE DOMAIN money_amt AS numeric(19,2);
