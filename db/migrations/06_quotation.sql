-- ============================================================
-- 06 报价单（§6.5）
--   金额公式以 GENERATED 列固化，杜绝前后端口径漂移：
--     amount = total*order_discount_rate + other_charges - discount
--     gross_profit = amount - cost
-- ============================================================

CREATE TABLE quotation (
  quotation_id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id     bigint NOT NULL REFERENCES organization,
  code                varchar(40) NOT NULL,
  version             smallint NOT NULL DEFAULT 1,
  source_code         varchar(40),
  name                varchar(200) NOT NULL,
  customer_id         bigint NOT NULL REFERENCES customer,
  contact_id          bigint REFERENCES contact,
  opportunity_id      bigint REFERENCES opportunity,
  bidder_id           bigint REFERENCES app_user,
  quote_date          date,
  expired_date        date,
  currency            char(3) NOT NULL DEFAULT 'CNY',
  status              smallint NOT NULL DEFAULT 0 CHECK (status IN (0,1,2,3)), -- 0初始1报价中2失效3已生成合同
  -- 基础（行项目维护）
  total               money_amt NOT NULL DEFAULT 0,
  cost                money_amt NOT NULL DEFAULT 0,
  order_discount_rate numeric(6,4) NOT NULL DEFAULT 1.0000,
  other_charges       money_amt NOT NULL DEFAULT 0,
  discount            money_amt NOT NULL DEFAULT 0,
  -- 派生（一致性由数据库保证）
  amount              money_amt GENERATED ALWAYS AS
                        (round(total * order_discount_rate + other_charges - discount, 2)) STORED,
  com_discount_rate   numeric(7,2) GENERATED ALWAYS AS
                        (CASE WHEN total > 0
                              THEN round((total*order_discount_rate+other_charges-discount)/total*100, 2)
                              ELSE 0 END) STORED,
  gross_profit        money_amt GENERATED ALWAYS AS
                        (round(total*order_discount_rate+other_charges-discount - cost, 2)) STORED,
  gross_profit_rate   numeric(7,2) GENERATED ALWAYS AS
                        (CASE WHEN (total*order_discount_rate+other_charges-discount) > 0
                              THEN round((total*order_discount_rate+other_charges-discount - cost)
                                         /(total*order_discount_rate+other_charges-discount)*100, 2)
                              ELSE 0 END) STORED,
  approval            approval_status NOT NULL DEFAULT -1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code, version)
);
CREATE INDEX ix_quotation_org      ON quotation (organization_id, status);
CREATE INDEX ix_quotation_customer ON quotation (customer_id);
CREATE INDEX ix_quotation_opp      ON quotation (opportunity_id);
CREATE INDEX ix_quotation_name_trgm ON quotation USING gin (name gin_trgm_ops);

CREATE TABLE quotation_product (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quotation_id    bigint NOT NULL REFERENCES quotation ON DELETE CASCADE,
  product_id      bigint NOT NULL REFERENCES product,
  spec            varchar(120),
  quantity        integer NOT NULL DEFAULT 1,
  price           money_amt NOT NULL DEFAULT 0,             -- 原价
  discount_rate   numeric(6,4) NOT NULL DEFAULT 1.0000,
  discount_price  money_amt GENERATED ALWAYS AS (round(price * discount_rate, 2)) STORED, -- 售价
  total_price     money_amt GENERATED ALWAYS AS (round(price * discount_rate * quantity, 2)) STORED, -- 小计
  cost            money_amt NOT NULL DEFAULT 0
);
CREATE INDEX ix_quoprod_quo ON quotation_product (quotation_id);

CREATE TRIGGER trg_quotation_updated BEFORE UPDATE ON quotation FOR EACH ROW EXECUTE FUNCTION set_updated_at();
