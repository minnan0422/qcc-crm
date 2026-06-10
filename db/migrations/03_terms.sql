-- ============================================================
-- 03 字典 term（§9.4）—— 可配置枚举的唯一来源
--   business_type：1来源 2商机阶段 3客户状态 4线索状态 5线索阶段
--                  6客户分类 7工单类型 8跟进方式 9线索无效原因
--                  100分级 101线索分组 102标签 103回款类型 104发票种类 105支付方式
-- organization_id 为 NULL 表示系统级字典（企业自定义时插入本租户行覆盖）
-- ============================================================

CREATE TABLE term (
  term_id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint REFERENCES organization,   -- NULL=系统级
  business_type   smallint NOT NULL,
  name            varchar(120) NOT NULL,
  kind            varchar(16) CHECK (kind IN ('info','success','warning','danger','neutral')),
  sort_order      smallint NOT NULL DEFAULT 0,
  active          smallint NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
-- 翻译 term_id 是高频点查；按 (org, business_type) 取字典列表也是高频
CREATE INDEX ix_term_lookup ON term (organization_id, business_type, active);
CREATE TRIGGER trg_term_updated BEFORE UPDATE ON term FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE term IS '全局字典；前端通过 useTerm 翻译，支持企业自定义';
