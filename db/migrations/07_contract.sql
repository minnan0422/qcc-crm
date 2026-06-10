-- ============================================================
-- 07 合同订单（§6.6）
--   received_amount / invoice_amount 由下游 payment_sheet / invoice 触发器回写；
--   outstanding / received_rate / not_invoice 为 GENERATED 派生列（前端只读）。
-- ============================================================

CREATE TABLE contract (
  contract_id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id    bigint NOT NULL REFERENCES organization,
  code               varchar(40) NOT NULL,
  name               varchar(200) NOT NULL,
  customer_id        bigint NOT NULL REFERENCES customer,
  quotation_id       bigint REFERENCES quotation,
  opportunity_id     bigint REFERENCES opportunity,
  contract_type      smallint NOT NULL DEFAULT 1 CHECK (contract_type IN (1,2,3)), -- 1常规2框架主3框架子
  parent_contract_id bigint REFERENCES contract,
  renew_type         smallint NOT NULL DEFAULT 1 CHECK (renew_type IN (1,2)),      -- 1一次性2到期续约
  begin_date         date,
  expired_date       date,
  currency           char(3) NOT NULL DEFAULT 'CNY',
  status             smallint NOT NULL DEFAULT 0 CHECK (status IN (0,1,2,3,4,5)),  -- 0初始1签约2执行中3完毕4终止5作废
  amount             money_amt NOT NULL DEFAULT 0,
  received_amount    money_amt NOT NULL DEFAULT 0,   -- 由 payment_sheet 回写
  bad_debts_amount   money_amt NOT NULL DEFAULT 0,
  invoice_amount     money_amt NOT NULL DEFAULT 0,   -- 由 invoice 回写
  gross_profit       money_amt NOT NULL DEFAULT 0,
  cash_profit        money_amt NOT NULL DEFAULT 0,
  outstanding_amount money_amt GENERATED ALWAYS AS (amount - received_amount) STORED,
  not_invoice_amount money_amt GENERATED ALWAYS AS (amount - invoice_amount) STORED,
  received_rate      numeric(7,2) GENERATED ALWAYS AS
                       (CASE WHEN amount > 0 THEN round(received_amount/amount*100, 2) ELSE 0 END) STORED,
  labels             bigint[] NOT NULL DEFAULT '{}',
  approval           approval_status NOT NULL DEFAULT -1,
  change_approval    approval_status NOT NULL DEFAULT -1,
  archive            boolean NOT NULL DEFAULT false,
  leader_id          bigint REFERENCES app_user,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);
CREATE INDEX ix_contract_org_status ON contract (organization_id, status);
CREATE INDEX ix_contract_customer   ON contract (customer_id);
CREATE INDEX ix_contract_leader     ON contract (organization_id, leader_id);
CREATE INDEX ix_contract_name_trgm  ON contract USING gin (name gin_trgm_ops);
CREATE INDEX ix_contract_parent     ON contract (parent_contract_id) WHERE parent_contract_id IS NOT NULL;
-- 待续约扫描：到期续约 + 临近到期 + 未归档
CREATE INDEX ix_contract_renew ON contract (expired_date)
  WHERE renew_type = 2 AND archive = false AND status IN (1,2);

CREATE TABLE contract_product (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  contract_id  bigint NOT NULL REFERENCES contract ON DELETE CASCADE,
  product_id   bigint NOT NULL REFERENCES product,
  quantity     integer NOT NULL DEFAULT 1,
  price        money_amt NOT NULL DEFAULT 0,
  total_price  money_amt GENERATED ALWAYS AS (round(price * quantity, 2)) STORED,
  cost         money_amt NOT NULL DEFAULT 0
);
CREATE INDEX ix_contractprod_contract ON contract_product (contract_id);

-- 续约记录（§6.6 续约）
CREATE TABLE contract_renewal (
  renewal_id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  contract_id     bigint NOT NULL REFERENCES contract ON DELETE CASCADE,
  new_contract_id bigint REFERENCES contract,
  opportunity_id  bigint REFERENCES opportunity,    -- 自动生成的续约商机
  expired_date    date,
  status          smallint NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_renewal_contract ON contract_renewal (contract_id);

CREATE TRIGGER trg_contract_updated BEFORE UPDATE ON contract FOR EACH ROW EXECUTE FUNCTION set_updated_at();
