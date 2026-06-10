-- ============================================================
-- 09 待办中心（§7）+ 目标管理（§6.9）+ AI（§8）
-- ============================================================

-- 统一待办 back_log
CREATE TABLE back_log (
  back_log_id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  business_type   smallint NOT NULL,    -- 10跟进20合同30审批40工单50掉保客户51掉保线索60回款70商机超时
  business_id     bigint,
  business_name   varchar(200),
  user_id         bigint NOT NULL REFERENCES app_user,
  status          smallint NOT NULL DEFAULT 0 CHECK (status IN (0,1)),  -- 0待办 1完成
  deadline_date   date,
  deadline_type   smallint CHECK (deadline_type IN (1,2,3)),            -- 1今天2七天3过期
  tip_msg         jsonb,                                                 -- 审批详情等
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
-- 「我的待办」高频：用户 + 状态 + 截止日；部分索引只覆盖未完成项
CREATE INDEX ix_backlog_user_open ON back_log (user_id, deadline_date)
  WHERE status = 0;
CREATE INDEX ix_backlog_org_type ON back_log (organization_id, business_type, status);

-- 目标
CREATE TABLE target (
  target_id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  user_id         bigint REFERENCES app_user,
  department_id   bigint REFERENCES department,
  year            smallint NOT NULL,
  month           smallint CHECK (month BETWEEN 1 AND 12),
  category        smallint NOT NULL CHECK (category IN (1,2)), -- 1合同额 2回款额
  target_amount   money_amt NOT NULL DEFAULT 0,
  finished_amount money_amt NOT NULL DEFAULT 0,
  new_sign_amount money_amt NOT NULL DEFAULT 0,
  renew_amount    money_amt NOT NULL DEFAULT 0,
  achieve_rate    numeric(7,2) GENERATED ALWAYS AS
                    (CASE WHEN target_amount > 0 THEN round(finished_amount/target_amount*100, 2) ELSE 0 END) STORED,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_target_lookup ON target (organization_id, year, month, category);

-- 月计划明细
CREATE TABLE month_plan (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  target_id   bigint NOT NULL REFERENCES target ON DELETE CASCADE,
  plan_date   date NOT NULL,
  plan_amount money_amt NOT NULL DEFAULT 0
);

-- AI 提示词（§8）：product_code 0线索1客户2合同3商机；business_type 商机时=阶段
CREATE TABLE ai_prompt (
  prompt_id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint REFERENCES organization,    -- NULL=系统级
  prompt_name     varchar(120),
  product_code    smallint NOT NULL CHECK (product_code IN (0,1,2,3)),
  business_type   bigint,
  content         text NOT NULL,
  active          smallint NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_aiprompt_lookup ON ai_prompt (organization_id, product_code, business_type);

-- AI 报告 / 分析历史
CREATE TABLE ai_report (
  report_id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  business_type   smallint NOT NULL CHECK (business_type IN (0,1,2,3)),
  business_id     bigint NOT NULL,
  stage_id        bigint,
  status          smallint NOT NULL DEFAULT 0 CHECK (status IN (0,1,2,3)), -- 待发送/处理中/成功/失败
  content         jsonb,                              -- {summary,points,risks,suggestions,actionItems}
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_aireport_biz ON ai_report (organization_id, business_type, business_id, stage_id);

-- 报告对话
CREATE TABLE ai_report_chat (
  chat_id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id  bigint NOT NULL REFERENCES ai_report ON DELETE CASCADE,
  role       varchar(10) NOT NULL CHECK (role IN ('user','ai')),
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_aichat_report ON ai_report_chat (report_id, created_at);

CREATE TRIGGER trg_backlog_updated BEFORE UPDATE ON back_log FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_target_updated  BEFORE UPDATE ON target   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
