import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/schema/sources.ts",
    "./src/schema/ingestionRuns.ts",
    "./src/schema/accountSnapshots.ts",
    "./src/schema/users.ts",
    "./src/schema/alertRules.ts",
    "./src/schema/alerts.ts",
  ],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/dashboard" },
  strict: true,
  verbose: true,
});