-- ============================================================
-- 12 协同模块：外勤签到 / 工单 / 审批流 / 企微协同
-- ============================================================

-- ---- 外勤签到 sign ----
CREATE TABLE sign (
  sign_id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  user_id         bigint NOT NULL REFERENCES app_user,
  type            smallint NOT NULL DEFAULT 2 CHECK (type IN (1,2)), -- 1上下班 2外勤拜访
  customer_id     bigint REFERENCES customer,
  address         varchar(300),
  longitude       numeric(10,6),
  latitude        numeric(10,6),
  remark          text,
  photo_url       varchar(300),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_sign_user ON sign (organization_id, user_id, created_at DESC);

-- ---- 工单 ticket ----
CREATE TABLE ticket (
  ticket_id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  code            varchar(40) NOT NULL,
  title           varchar(200) NOT NULL,
  type_term_id    bigint REFERENCES term,                 -- 工单类型(bt=7)
  customer_id     bigint REFERENCES customer,
  priority        smallint NOT NULL DEFAULT 2 CHECK (priority IN (1,2,3)), -- 1低2中3高
  status          smallint NOT NULL DEFAULT 1 CHECK (status IN (1,2,3,4)), -- 1待处理2处理中3已解决4已关闭
  assignee_id     bigint REFERENCES app_user,
  creator_id      bigint REFERENCES app_user,
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);
CREATE INDEX ix_ticket_org_status ON ticket (organization_id, status);
CREATE INDEX ix_ticket_assignee   ON ticket (organization_id, assignee_id);
CREATE INDEX ix_ticket_title_trgm ON ticket USING gin (title gin_trgm_ops);
CREATE TRIGGER trg_ticket_updated BEFORE UPDATE ON ticket FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE ticket_comment (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id  bigint NOT NULL REFERENCES ticket ON DELETE CASCADE,
  user_id    bigint NOT NULL REFERENCES app_user,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_tcomment_ticket ON ticket_comment (ticket_id, created_at);

-- ---- 审批流 work_flow ----
-- 模板：business_type 1报价2合同3合同变更4回款单5发票6预授信7商机
CREATE TABLE work_flow_route (
  route_id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  business_type   smallint NOT NULL,
  name            varchar(120) NOT NULL,
  nodes           jsonb NOT NULL DEFAULT '[]',   -- [{name, approverIds:[]}]
  active          smallint NOT NULL DEFAULT 1
);
CREATE INDEX ix_wfroute_lookup ON work_flow_route (organization_id, business_type, active);

-- 实例（一张业务单据一条审批任务）
CREATE TABLE work_flow_task (
  task_id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  business_type   smallint NOT NULL,
  business_id     bigint NOT NULL,
  business_name   varchar(200),
  route_id        bigint REFERENCES work_flow_route,
  applicant_id    bigint NOT NULL REFERENCES app_user,
  status          smallint NOT NULL DEFAULT 2 CHECK (status IN (2,3,11)), -- 2进行中3驳回11通过
  current_node    smallint NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_wftask_biz       ON work_flow_task (organization_id, business_type, business_id);
CREATE INDEX ix_wftask_applicant ON work_flow_task (organization_id, applicant_id);
CREATE INDEX ix_wftask_open      ON work_flow_task (organization_id) WHERE status = 2;
CREATE TRIGGER trg_wftask_updated BEFORE UPDATE ON work_flow_task FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 节点审批记录
CREATE TABLE work_flow_task_node (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  task_id      bigint NOT NULL REFERENCES work_flow_task ON DELETE CASCADE,
  node_index   smallint NOT NULL,
  name         varchar(120),
  approver_ids bigint[] NOT NULL DEFAULT '{}',
  action       smallint NOT NULL DEFAULT 0 CHECK (action IN (0,11,3)), -- 0待批11通过3驳回
  acted_by     bigint REFERENCES app_user,
  comment      text,
  acted_at     timestamptz
);
CREATE INDEX ix_wfnode_task ON work_flow_task_node (task_id, node_index);
-- 「待我审批」：按审批人数组检索
CREATE INDEX ix_wfnode_approvers ON work_flow_task_node USING gin (approver_ids);

-- ---- 企微协同 qywx：消息/通知记录（推送 WeCom；未配置则落库为 log）----
CREATE TABLE qywx_message (
  msg_id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  to_user_id      bigint REFERENCES app_user,
  business_type   smallint,
  business_id     bigint,
  content         text NOT NULL,
  channel         varchar(16) NOT NULL DEFAULT 'log',  -- wecom / log
  status          smallint NOT NULL DEFAULT 1,          -- 1已发送 0失败
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_qywx_to ON qywx_message (organization_id, to_user_id, created_at DESC);
