-- Allow distributed collectors to push data into account_snapshots
-- without touching PostgreSQL directly. Each `sources` row gets its own
-- opaque ingest token; collectors POST EAV rows + their token to the
-- admin API. Failure or rotation of the token never touches the
-- collector''s database credentials (we have none, by design).
ALTER TABLE sources ADD COLUMN IF NOT EXISTS ingest_token_hash text;