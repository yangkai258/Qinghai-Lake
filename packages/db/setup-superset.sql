-- Superset read-only role. Run once after initdb.
-- Superset connects as this user; never as `postgres`.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'superset') THEN
    CREATE ROLE superset LOGIN PASSWORD 'superset_readonly_2026';
  END IF;
END $$;

GRANT CONNECT ON DATABASE dashboard TO superset;
GRANT USAGE ON SCHEMA public TO superset;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO superset;  -- includes views in modern PG\nALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO superset;