-- users (admin login)
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS sources (
  id text PRIMARY KEY,
  kind text NOT NULL,
  display_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  cron_expr text,
  last_run_at timestamptz,
  last_status text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id bigserial PRIMARY KEY,
  source_id text NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz NOT NULL,
  rows_written integer NOT NULL DEFAULT 0,
  status text NOT NULL,
  error text
);
CREATE INDEX IF NOT EXISTS idx_runs_source_time ON ingestion_runs (source_id, finished_at);

CREATE TABLE IF NOT EXISTS account_snapshots (
  id bigserial PRIMARY KEY,
  source_id text NOT NULL,
  captured_at timestamptz NOT NULL,
  entity_kind text NOT NULL,
  entity_id text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric(24,6),
  dims jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_snap_entity ON account_snapshots (entity_kind, entity_id, metric_name, captured_at);
CREATE INDEX IF NOT EXISTS idx_snap_source ON account_snapshots (source_id, captured_at);
CREATE INDEX IF NOT EXISTS idx_snap_metric ON account_snapshots (metric_name, captured_at);
CREATE INDEX IF NOT EXISTS idx_snap_dims  ON account_snapshots USING gin (dims);
CREATE UNIQUE INDEX IF NOT EXISTS uq_snap_entity_metric_capture
  ON account_snapshots (entity_kind, entity_id, metric_name, captured_at);

DROP VIEW IF EXISTS v_douyin_account_latest;
CREATE OR REPLACE VIEW v_douyin_account_latest AS
SELECT
  entity_id                                                    AS account_name,
  (dims ->> 'dept')::text                                      AS dept,
  (dims ->> 'person')::text                                    AS person,
  (dims ->> 'douyin_name')::text                               AS douyin_name,
  (dims ->> 'status')::text                                    AS status,
  MAX(CASE WHEN metric_name = 'plays_inc'   THEN metric_value END) AS plays_inc,
  MAX(CASE WHEN metric_name = 'like_count'  THEN metric_value END) AS like_count,
  MAX(CASE WHEN metric_name = 'fans_total'  THEN metric_value END) AS fans_total,
  MAX(CASE WHEN metric_name = 'fans_inc'    THEN metric_value END) AS fans_inc,
  MAX(CASE WHEN metric_name = 'works_total' THEN metric_value END) AS works_total,
  MAX(CASE WHEN metric_name = 'rate'        THEN metric_value END) AS rate,
  MAX(captured_at)                                              AS captured_at
FROM account_snapshots
WHERE entity_kind = 'douyin_account'
GROUP BY entity_id, dims;
CREATE TABLE IF NOT EXISTS alert_rules (
  id text PRIMARY KEY,
  name text NOT NULL,
  enabled text NOT NULL DEFAULT 'true',
  kind text NOT NULL,
  threshold numeric(18,4) NOT NULL,
  severity text NOT NULL DEFAULT 'warn',
  scope text NOT NULL DEFAULT 'all',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS alerts (
  id text PRIMARY KEY,
  rule_id text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  fired_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON alerts (resolved, fired_at DESC);
