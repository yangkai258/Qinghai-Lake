CREATE TABLE IF NOT EXISTS "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"display_name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cron_expr" text,
	"last_run_at" timestamp with time zone,
	"last_status" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingestion_runs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text NOT NULL,
	"rows_loaded" integer DEFAULT 0 NOT NULL,
	"error_text" text,
	"stats" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"entity_id" text NOT NULL,
	"entity_kind" text NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" numeric(24, 6),
	"dims" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_snap_entity" ON "account_snapshots" USING btree ("entity_kind","entity_id","metric_name","captured_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_snap_source" ON "account_snapshots" USING btree ("source_id","captured_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_snap_metric" ON "account_snapshots" USING btree ("metric_name","captured_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_snap_dims" ON "account_snapshots" USING gin ("dims");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_snap_entity_metric_capture" ON "account_snapshots" USING btree ("entity_kind","entity_id","metric_name","captured_at");