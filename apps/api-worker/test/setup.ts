import { env } from "cloudflare:workers";
import { applyD1Migrations } from "cloudflare:test";

// Runs once before all tests: executes real SQL migrations in memory!
await applyD1Migrations(
  (env as unknown as { DB: D1Database }).DB,
  (env as unknown as { TEST_MIGRATIONS: unknown[] }).TEST_MIGRATIONS,
);
