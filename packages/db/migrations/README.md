# Migrations

Each subdir is a numbered migration, applied in order. For a fresh DB install
in dev, use the convenience `pnpm db:setup` which runs `push.sql` followed
by every migration in order. For production, use `psql -f` per migration.

Layout:
- `0000_initial` (in git) - sources, ingestion_runs, account_snapshots, view
- `0001_alert_rules_and_users` - users + alert_rules + alerts

After editing schema/*.ts, regenerate the next migration with:
  pnpm db:generate