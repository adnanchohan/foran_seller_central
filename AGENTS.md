# Agent Governance & Monorepo Operational Guidelines

> **Mandatory Policy for AI Agents and Automated Contributors**

This document establishes the operational rules and security constraints for automated agents modifying this repository.

---

## 1. Zero Unauthorized Git Operations

- **Never** perform automatic `git commit`, `git push`, branch deletion, or tag operations without explicit human user direction.
- Work within workspace files and present diffs, test verifications, and explanations directly to the user.

---

## 2. Master Verification Standard (`pnpm check`)

Before declaring any architectural task complete, the entire quality gate must pass without errors:

```bash
pnpm check
```

This enforces:

1. `pnpm format:check` — Prettier validation.
2. `pnpm contract:lint` — Redocly OpenAPI 3.1 linting on `packages/contracts/openapi/v1.yaml`.
3. `pnpm lint` — Turborepo ESLint flat config with `consistent-type-imports`.
4. `pnpm typecheck` — Turborepo strict TypeScript typechecking across all packages.
5. `pnpm test` — Turborepo Vitest unit and integration suites (Workers in-memory D1 test runner + RTL JSDOM).
6. `pnpm build` — Turborepo full build verification.

---

## 3. Architectural Separation & Tech Stack Rules

- **Cloudflare Edge First**: Backend logic runs on Cloudflare Workers (`workerd`) via Hono (`apps/api-worker`). Never introduce Node.js-only dependencies or native modules into worker runtimes.
- **Contract-First Source of Truth**: All API endpoints, request bodies, queries, and responses must be defined in `packages/contracts/openapi/v1.yaml`.
- **Database Layer**: All D1 operations must use Drizzle ORM in `packages/db`. Raw, ad-hoc SQL strings in route handlers are strictly prohibited.
- **Repository Pattern**: Route handlers in `apps/api-worker` must interact with the database exclusively through dedicated repository functions in `src/data/`.
- **Deterministic Testing**: Route factories and apps must use dependency injection (`now`, auth verifiers, storage) to ensure tests never depend on real wall-clock time or external network services.
- **Frontend SPA Routing**: Frontends (`apps/user-dashboard`, `apps/admin-dashboard`) must support base paths and deep linking with `public/_redirects`.
