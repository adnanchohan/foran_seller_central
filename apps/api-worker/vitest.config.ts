import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrationsPath = path.resolve(import.meta.dirname, "../../packages/db/migrations");
      const migrations = await readD1Migrations(migrationsPath);

      return {
        miniflare: {
          bindings: {
            ADMIN_GOOGLE_SUBS: "test-admin-subject",
            ADMIN_EMAILS: "admin@example.test,admin@foran.pk",
            DASHBOARD_ORIGINS: "http://localhost:5173",
            GOOGLE_CLIENT_ID: "test-google-client-id.apps.googleusercontent.com",
            LOG_LEVEL: "error",
            SESSION_TTL_SECONDS: "3600",
            MAX_UPLOAD_MB: "10",
            TEST_MIGRATIONS: migrations,
          },
        },
        wrangler: { configPath: "./wrangler.jsonc" },
      };
    }),
  ],
  test: {
    setupFiles: ["./test/setup.ts"],
  },
});
