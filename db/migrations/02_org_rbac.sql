-- ============================================================
-- 02 多租户、组织树、RBAC（§9.1 / §9.2）
-- ============================================================

-- 租户
CREATE TABLE organization (
  organization_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            varchar(200) NOT NULL,
  ref_company_id  varchar(64),                 -- 企查查公司ID
  active          smallint NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 部门树（path 物化路径 + depth，避免递归查询）
CREATE TABLE department (
  department_id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  parent_id       bigint REFERENCES department,
  name            varchar(120) NOT NULL,
  path            varchar(500) NOT NULL DEFAULT '',  -- 如 '1,2,5'
  depth           smallint NOT NULL DEFAULT 0,
  active          smallint NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_department_org      ON department (organization_id);
CREATE INDEX ix_department_parent   ON department (parent_id);
-- 物化路径前缀匹配「本部门及下属」(role.scope=3)：path LIKE '1,2,%'
CREATE INDEX ix_department_path_trgm ON department USING gin (path gin_trgm_ops);

-- 员工（user 为保留字，使用 app_user）
CREATE TABLE app_user (
  user_id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  department_id   bigint REFERENCES department,
  name            varchar(80) NOT NULL,
  phone           varchar(20),
  email           varchar(120),
  avatar          varchar(300),
  position        smallint NOT NULL DEFAULT 0,  -- 0职员 1主管
  active          smallint NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_user_org  ON app_user (organization_id);
CREATE INDEX ix_user_dep  ON app_user (department_id);
CREATE INDEX ix_user_name_trgm ON app_user USING gin (name gin_trgm_ops);

-- 角色（scope 控数据范围：1本人/2本部门/3本部门及下属/4全公司）
CREATE TABLE role (
  role_id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organization,
  name            varchar(80) NOT NULL,
  scope           smallint NOT NULL DEFAULT 1 CHECK (scope IN (1,2,3,4)),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_role_org ON role (organization_id);

CREATE TABLE permission (
  permission_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code          varchar(80) NOT NULL UNIQUE,   -- 如 'customer.export'
  name          varchar(120) NOT NULL,
  type          smallint NOT NULL DEFAULT 10    -- 10用户 20管理
);

CREATE TABLE role_permission (
  role_id       bigint NOT NULL REFERENCES role ON DELETE CASCADE,
  permission_id bigint NOT NULL REFERENCES permission ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_role (
  user_id bigint NOT NULL REFERENCES app_user ON DELETE CASCADE,
  role_id bigint NOT NULL REFERENCES role ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TRIGGER trg_org_updated  BEFORE UPDATE ON organization FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_dep_updated  BEFORE UPDATE ON department   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_updated BEFORE UPDATE ON app_user     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_role_updated BEFORE UPDATE ON role         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
