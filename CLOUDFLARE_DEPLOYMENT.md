# Cloudflare Deployment & Operations Guide

This platform is engineered natively for the Cloudflare serverless edge:

- **Gateway Worker (`apps/router-worker`)**: Single-domain entrypoint that routes `/v1/*`, `/health`, and `/ready` to the API worker via 0ms-latency Service Bindings, and proxies `/user/*` and `/admin/*` to Cloudflare Pages origins.
- **API Worker (`apps/api-worker`)**: Edge backend running on Cloudflare Workers (`workerd`) with Hono v4.
- **Database (`packages/db`)**: Serverless SQLite on Cloudflare D1 using Drizzle ORM migrations.
- **Private Object Storage**: Cloudflare R2 bucket (`foran-seller-documents`) for store verification documents and CNIC files.
- **Dashboards (`apps/user-dashboard`, `apps/admin-dashboard`)**: React 19 + Vite SPAs deployed to Cloudflare Pages with `public/_redirects` for deep linking.

---

## 1. Prerequisites

- **Node.js**: `>=24`
- **pnpm**: `>=11.9.0`
- **Cloudflare Account**: with D1, R2, Workers, and Pages enabled.
- **Wrangler CLI**: authenticated via `npx wrangler login`.

---

## 2. Verify Local Workspace & Quality Gate

Run the master quality gate command:

```bash
pnpm check
```

This verifies:

1. `pnpm format:check` — Prettier validation
2. `pnpm contract:lint` — Redocly OpenAPI 3.1 linting on `packages/contracts/openapi/v1.yaml`
3. `pnpm lint` — Turborepo ESLint flat config
4. `pnpm typecheck` — Turborepo strict TypeScript typechecking
5. `pnpm test` — In-memory D1 Workers test suite (`@cloudflare/vitest-plugin`) and React Testing Library suites
6. `pnpm build` — Full build verification for all packages

---

## 3. Provision Cloudflare Resources

### A. Create Cloudflare D1 Database

```bash
npx wrangler d1 create foran-seller-central-db
```

Copy the returned `database_id` into `apps/api-worker/wrangler.jsonc`.

### B. Create Private R2 Bucket

```bash
npx wrangler r2 bucket create foran-seller-documents
```

> [!IMPORTANT]
> Keep the R2 bucket strictly private. Seller CNIC and legal documents must only be streamed through authenticated admin endpoints (`/v1/admin/documents/:id/download`).

---

## 4. Apply Database Migrations

Generate migrations if you modified schema:

```bash
pnpm db:generate
```

Apply migrations locally for development:

```bash
pnpm db:migrate:local
```

Apply migrations to remote production D1:

```bash
pnpm --filter @foran/api-worker exec wrangler d1 migrations apply DB --remote
```

---

## 5. Configure Worker Secrets

Configure required secrets in `apps/api-worker`:

```bash
npx wrangler secret put GOOGLE_CLIENT_ID --config apps/api-worker/wrangler.jsonc
npx wrangler secret put ADMIN_EMAILS --config apps/api-worker/wrangler.jsonc
npx wrangler secret put ADMIN_GOOGLE_SUBS --config apps/api-worker/wrangler.jsonc
```

- `GOOGLE_CLIENT_ID`: Your Google OAuth 2.0 Web Client ID.
- `ADMIN_EMAILS`: Comma-separated list of administrative Google email addresses.
- `ADMIN_GOOGLE_SUBS`: (Optional) Comma-separated list of administrative Google Subject IDs (`sub`).

---

## 6. Deploying Dashboards (Cloudflare Pages)

Build both frontend SPAs:

```bash
pnpm --filter @foran/user-dashboard build
pnpm --filter @foran/admin-dashboard build
```

Deploy to Cloudflare Pages:

```bash
# Deploy User Dashboard
npx wrangler pages deploy apps/user-dashboard/dist --project-name foran-user-dashboard

# Deploy Admin Dashboard
npx wrangler pages deploy apps/admin-dashboard/dist --project-name foran-admin-dashboard
```

Update `apps/router-worker/wrangler.jsonc` with your production Pages origins:

- `USER_PAGES_ORIGIN`: e.g. `https://foran-user-dashboard.pages.dev`
- `ADMIN_PAGES_ORIGIN`: e.g. `https://foran-admin-dashboard.pages.dev`

---

## 7. Deploy Workers

### Deploy API Worker:

```bash
pnpm --filter @foran/api-worker exec wrangler deploy
```

### Deploy Router Worker Gateway:

```bash
pnpm --filter @foran/router-worker exec wrangler deploy
```

---

## 8. Verification & Health Check

Test the live gateway endpoints:

```bash
# Health probe
curl https://YOUR_ROUTER_DOMAIN/health
# Response: {"status":"ok","service":"foran-api-worker"}

# Readiness probe
curl https://YOUR_ROUTER_DOMAIN/ready
# Response: {"ready":true}
```

Then open the user dashboard at `https://YOUR_ROUTER_DOMAIN/user/` or sign in as an admin at `https://YOUR_ROUTER_DOMAIN/admin/`.
