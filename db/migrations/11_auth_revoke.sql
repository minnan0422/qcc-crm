-- ============================================================
-- 11 令牌吊销：token_version（改密/踢人即递增，使旧 JWT 失效）
-- ============================================================
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 0;
