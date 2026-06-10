-- ============================================================
-- 05 产品目录（§6.8）+ 商机（§6.4）
-- ============================================================

CREATE TABLE product_category (
  category_id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  parent_id       bigint REFERENCES product_category,
  name            varchar(120) NOT NULL,
  path            varchar(500) NOT NULL DEFAULT '',
  active          smallint NOT NULL DEFAULT 1
);
CREATE INDEX ix_pcat_org ON product_category (organization_id);

CREATE TABLE product (
  product_id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  category_id     bigint REFERENCES product_category,
  code            varchar(60) NOT NULL,
  name            varchar(200) NOT NULL,
  spec            varchar(120),
  unit            varchar(20),
  time_limits     integer,                       -- 服务周期（月）
  price           money_amt NOT NULL DEFAULT 0,
  cost            money_amt NOT NULL DEFAULT 0,
  min_discount    numeric(4,2) NOT NULL DEFAULT 0.00, -- 折扣下限
  max_discount    numeric(4,2) NOT NULL DEFAULT 1.00,
  free_pricing    boolean NOT NULL DEFAULT false,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);
CREATE INDEX ix_product_org  ON product (organization_id, active);
CREATE INDEX ix_product_name_trgm ON product USING gin (name gin_trgm_ops);

-- 多币种价
CREATE TABLE product_currency (
  product_id bigint NOT NULL REFERENCES product ON DELETE CASCADE,
  currency   char(3) NOT NULL,
  price      money_amt NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, currency)
);

-- 商机
CREATE TABLE opportunity (
  opportunity_id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id    bigint NOT NULL REFERENCES organization,
  code               varchar(40) NOT NULL,
  name               varchar(200) NOT NULL,
  customer_id        bigint NOT NULL REFERENCES customer,
  liaison_id         bigint REFERENCES contact,        -- 联络人
  key_man_id         bigint REFERENCES contact,        -- 决策人
  estimated_amount   money_amt NOT NULL DEFAULT 0,
  expiry_date        date,                              -- 预计成交日期
  status_term_id     bigint REFERENCES term,            -- 阶段
  status_expiry_at   timestamptz,                       -- 阶段超时时间
  all_stay_time      integer NOT NULL DEFAULT 0,        -- 停留天数
  leader_id          bigint REFERENCES app_user,
  department_id      bigint REFERENCES department,
  competitor         varchar(120),
  main_product       varchar(200),
  renew_type         smallint NOT NULL DEFAULT 1 CHECK (renew_type IN (1,2)),
  additional         smallint NOT NULL DEFAULT 1 CHECK (additional IN (1,2)),
  approval           approval_status NOT NULL DEFAULT -1,
  active             smallint NOT NULL DEFAULT 1,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);
CREATE INDEX ix_opp_org_status  ON opportunity (organization_id, status_term_id, active);
CREATE INDEX ix_opp_customer    ON opportunity (customer_id);
CREATE INDEX ix_opp_leader      ON opportunity (organization_id, leader_id);
CREATE INDEX ix_opp_name_trgm   ON opportunity USING gin (name gin_trgm_ops);
-- 阶段超时扫描（仅未关闭的商机）
CREATE INDEX ix_opp_status_expiry ON opportunity (status_expiry_at) WHERE active = 1;

-- 商机产品行
CREATE TABLE opportunity_product (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  opportunity_id bigint NOT NULL REFERENCES opportunity ON DELETE CASCADE,
  product_id     bigint NOT NULL REFERENCES product,
  quantity       integer NOT NULL DEFAULT 1,
  price          money_amt NOT NULL DEFAULT 0
);
CREATE INDEX ix_oppprod_opp ON opportunity_product (opportunity_id);

-- 输单记录（§6.4）
CREATE TABLE opportunity_loss (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  opportunity_id bigint NOT NULL REFERENCES opportunity ON DELETE CASCADE,
  reason_term_id bigint REFERENCES term,
  reason         text,
  created_by     bigint REFERENCES app_user,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_product_updated BEFORE UPDATE ON product     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_opp_updated     BEFORE UPDATE ON opportunity FOR EACH ROW EXECUTE FUNCTION set_updated_at();
