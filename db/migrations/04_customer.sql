-- ============================================================
-- 04 客户/线索共表 + 联系人 + 跟进（§6.2 / §6.3 / §5.2-1）
-- ============================================================

-- 线索与客户共用一张表，category 区分（1个人线索 2线索池 3个人客户 4公海）
CREATE TABLE customer (
  customer_id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id    bigint NOT NULL REFERENCES organization,
  name               varchar(200) NOT NULL,
  ref_company_id     varchar(64),                       -- 企查查公司ID
  category           smallint NOT NULL CHECK (category IN (1,2,3,4)),
  level_term_id      bigint REFERENCES term,            -- 分级 A/B/C
  source_term_id     bigint REFERENCES term,            -- 来源
  status_term_id     bigint REFERENCES term,            -- current_tracking_status
  pool_group_term_id bigint REFERENCES term,            -- 线索分组
  industry           varchar(120),
  province           varchar(40),
  city               varchar(40),
  district           varchar(40),
  longitude          numeric(10,6),
  latitude           numeric(10,6),
  origin             smallint,                           -- 来源渠道
  labels             bigint[] NOT NULL DEFAULT '{}',     -- term_id[]，GIN 索引
  phone_name         varchar(80),                        -- 主联系人名
  phone              varchar(20),
  email              varchar(120),
  leader_id          bigint REFERENCES app_user,         -- 负责人（亦见 user_customer）
  pre_leader_id      bigint REFERENCES app_user,         -- 前负责人
  tracking_num       integer NOT NULL DEFAULT 0,
  tracking_update_at timestamptz,
  next_tracking_at   timestamptz,
  lose_time          timestamptz,                        -- 掉保计时
  growth_time        timestamptz,
  back_sea_time      timestamptz,                        -- 退回公海时间
  opportunity_count  integer NOT NULL DEFAULT 0,
  approval           approval_status NOT NULL DEFAULT -1,
  active             smallint NOT NULL DEFAULT 1,
  created_by         bigint REFERENCES app_user,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
-- 列表默认按 (org, category) 切线索/客户；再叠加负责人、状态过滤
CREATE INDEX ix_customer_org_cat     ON customer (organization_id, category, active);
CREATE INDEX ix_customer_leader      ON customer (organization_id, leader_id);
CREATE INDEX ix_customer_status      ON customer (organization_id, status_term_id);
CREATE INDEX ix_customer_name_trgm   ON customer USING gin (name gin_trgm_ops);
CREATE INDEX ix_customer_labels_gin  ON customer USING gin (labels);
-- 掉保/公海超时回收扫描：仅对在册线索/客户建部分索引
CREATE INDEX ix_customer_lose_time   ON customer (lose_time) WHERE lose_time IS NOT NULL AND active = 1;
-- 最新跟进排序
CREATE INDEX ix_customer_tracking_at ON customer (organization_id, tracking_update_at DESC);

-- 联系人
CREATE TABLE contact (
  contact_id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  customer_id     bigint NOT NULL REFERENCES customer ON DELETE CASCADE,
  name            varchar(80) NOT NULL,
  phone           varchar(20),
  email           varchar(120),
  wechat          varchar(80),
  position        varchar(80),
  department      varchar(80),
  type            smallint NOT NULL DEFAULT 2 CHECK (type IN (1,2)), -- 1主 2普通
  maintainer_id   bigint REFERENCES app_user,
  source_leads_id bigint,                                 -- 转客户时记录原线索
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_contact_customer ON contact (customer_id);
-- 一个客户至多一个主联系人
CREATE UNIQUE INDEX uq_contact_primary ON contact (customer_id) WHERE type = 1;

-- 跟进记录（business_type 可挂线索/客户/商机/合同/报价）
CREATE TABLE customer_tracking (
  tracking_id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id    bigint NOT NULL REFERENCES organization,
  customer_id        bigint NOT NULL REFERENCES customer ON DELETE CASCADE,
  business_type      smallint NOT NULL DEFAULT 1,
  business_id        bigint,
  tracking_type_term bigint REFERENCES term,              -- 跟进方式
  comment            text,
  next_tracking_at   timestamptz,
  priority_level     smallint CHECK (priority_level IN (1,2)), -- 1有效 2无效
  ding               bigint[] NOT NULL DEFAULT '{}',      -- 提醒人 user_id[]
  created_by         bigint REFERENCES app_user,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_tracking_customer ON customer_tracking (customer_id, created_at DESC);
CREATE INDEX ix_tracking_biz      ON customer_tracking (organization_id, business_type, business_id);

CREATE TRIGGER trg_customer_updated BEFORE UPDATE ON customer FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contact_updated  BEFORE UPDATE ON contact  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
