-- ============================================================
-- 08 资金：回款计划/回款单/核销、开票、预授信（§6.7）
--   回款单与发票通过触发器把金额汇总回写 contract（前端只读）。
-- ============================================================

-- 回款计划
CREATE TABLE payment (
  payment_id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id    bigint NOT NULL REFERENCES organization,
  contract_id        bigint NOT NULL REFERENCES contract ON DELETE CASCADE,
  customer_id        bigint NOT NULL REFERENCES customer,
  plan_amount        money_amt NOT NULL DEFAULT 0,
  received_amount    money_amt NOT NULL DEFAULT 0,   -- 由回款单回写
  bad_debts_amount   money_amt NOT NULL DEFAULT 0,
  outstanding_amount money_amt GENERATED ALWAYS AS (plan_amount - received_amount - bad_debts_amount) STORED,
  status             smallint NOT NULL DEFAULT 1 CHECK (status IN (1,2,3,4,5)), -- 1未收…5部分坏账
  type_term_id       bigint REFERENCES term,          -- 保证金/常规/尾款/预付款
  plan_date          date,                            -- 预计回款日
  leader_id          bigint REFERENCES app_user,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_payment_contract ON payment (contract_id);
-- 催收看板：按预计回款日 + 状态扫描未收的计划
CREATE INDEX ix_payment_collection ON payment (organization_id, plan_date)
  WHERE status IN (1,2,4);

-- 回款单（实际到账）
CREATE TABLE payment_sheet (
  sheet_id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  contract_id     bigint NOT NULL REFERENCES contract,
  payment_id      bigint REFERENCES payment,
  amount          money_amt NOT NULL DEFAULT 0,
  pay_method_term bigint REFERENCES term,
  arrival_date    date,
  write_off       boolean NOT NULL DEFAULT false,    -- 是否核销
  reversed        boolean NOT NULL DEFAULT false,    -- 红冲
  approval        approval_status NOT NULL DEFAULT -1,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_sheet_contract ON payment_sheet (contract_id);
CREATE INDEX ix_sheet_payment  ON payment_sheet (payment_id);

-- 回款单按合同核销明细
CREATE TABLE payment_sheet_detail (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sheet_id    bigint NOT NULL REFERENCES payment_sheet ON DELETE CASCADE,
  contract_id bigint NOT NULL REFERENCES contract,
  amount      money_amt NOT NULL DEFAULT 0
);
CREATE INDEX ix_sheetdetail_sheet ON payment_sheet_detail (sheet_id);

-- 发票
CREATE TABLE invoice (
  invoice_id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id   bigint NOT NULL REFERENCES organization,
  code              varchar(40),
  contract_id       bigint NOT NULL REFERENCES contract,
  customer_id       bigint NOT NULL REFERENCES customer,
  invoice_type_term bigint REFERENCES term,           -- 1普票…5收据
  red_blue_flag     smallint NOT NULL DEFAULT 1 CHECK (red_blue_flag IN (1,2)), -- 1蓝 2红
  invoice_attr      smallint,                          -- 纸质/数电
  amount            money_amt NOT NULL DEFAULT 0,      -- 含税
  tax_amount        money_amt NOT NULL DEFAULT 0,
  no_tax_amount     money_amt GENERATED ALWAYS AS (amount - tax_amount) STORED,
  status            smallint NOT NULL DEFAULT 0 CHECK (status IN (0,1,2,3)), -- 待开/已生成/红冲/作废
  invoice_url       varchar(300),                      -- 乐企开票链接
  approval          approval_status NOT NULL DEFAULT -1,
  invalid_approval  approval_status NOT NULL DEFAULT -1,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_invoice_contract ON invoice (contract_id);
CREATE INDEX ix_invoice_org      ON invoice (organization_id, status);

CREATE TABLE invoice_detail (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id  bigint NOT NULL REFERENCES invoice ON DELETE CASCADE,
  contract_id bigint NOT NULL REFERENCES contract,
  payment_id  bigint REFERENCES payment,
  amount      money_amt NOT NULL DEFAULT 0
);
CREATE INDEX ix_invdetail_invoice ON invoice_detail (invoice_id);

-- 预授信（先用后签）
CREATE TABLE pre_credit (
  pre_credit_id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id    bigint NOT NULL REFERENCES organization,
  contract_id        bigint REFERENCES contract,
  customer_id        bigint NOT NULL REFERENCES customer,
  amount             money_amt NOT NULL DEFAULT 0,
  term_days          integer NOT NULL DEFAULT 0,
  begin_date         date,
  end_date           date,
  expect_sign_date   date,
  expect_receive_date date,
  status             smallint NOT NULL DEFAULT 1 CHECK (status IN (1,2,3)),
  approval           approval_status NOT NULL DEFAULT -1,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_precredit_customer ON pre_credit (customer_id);

CREATE TRIGGER trg_payment_updated BEFORE UPDATE ON payment    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_invoice_updated BEFORE UPDATE ON invoice    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_precredit_updated BEFORE UPDATE ON pre_credit FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---- 金额回写触发器：回款单 → payment.received_amount & contract.received_amount ----
CREATE OR REPLACE FUNCTION rollup_payment_sheet() RETURNS trigger AS $$
DECLARE
  v_contract bigint := COALESCE(NEW.contract_id, OLD.contract_id);
  v_payment  bigint := COALESCE(NEW.payment_id, OLD.payment_id);
BEGIN
  -- 重算合同已回款（仅统计未红冲）
  UPDATE contract c SET received_amount = (
    SELECT COALESCE(SUM(amount),0) FROM payment_sheet
    WHERE contract_id = v_contract AND reversed = false
  ) WHERE c.contract_id = v_contract;

  IF v_payment IS NOT NULL THEN
    UPDATE payment p SET received_amount = (
      SELECT COALESCE(SUM(amount),0) FROM payment_sheet
      WHERE payment_id = v_payment AND reversed = false
    ) WHERE p.payment_id = v_payment;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sheet_rollup
  AFTER INSERT OR UPDATE OR DELETE ON payment_sheet
  FOR EACH ROW EXECUTE FUNCTION rollup_payment_sheet();

-- ---- 金额回写触发器：发票 → contract.invoice_amount（仅蓝票、未作废/红冲）----
CREATE OR REPLACE FUNCTION rollup_invoice() RETURNS trigger AS $$
DECLARE
  v_contract bigint := COALESCE(NEW.contract_id, OLD.contract_id);
BEGIN
  UPDATE contract c SET invoice_amount = (
    SELECT COALESCE(SUM(amount),0) FROM invoice
    WHERE contract_id = v_contract AND red_blue_flag = 1 AND status IN (1)
  ) WHERE c.contract_id = v_contract;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_rollup
  AFTER INSERT OR UPDATE OR DELETE ON invoice
  FOR EACH ROW EXECUTE FUNCTION rollup_invoice();
