-- This file is the canonical migration applying to a fresh install.
-- It runs after the initial 0000 (sources / ingestion_runs / account_snapshots / view).
-- Use psql: psql -U postgres -d dashboard -f migrations/0001_alert_rules_and_users/migration.sql

-- alert rules + alerts
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

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