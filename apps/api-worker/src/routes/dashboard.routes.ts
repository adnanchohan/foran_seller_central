import { Hono } from "hono";
import { findApplicationByUserId } from "../data/applications-repository.js";
import { createDrizzleDb } from "../data/db.js";
import { findPaymentByUserId } from "../data/payments-repository.js";
import { ApiError } from "../http/api-error.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import type { AppDependencies, AppEnv } from "../types.js";

export function createDashboardRoutes(deps: AppDependencies = {}) {
  const routes = new Hono<AppEnv>();

  routes.use("*", createAuthMiddleware(deps));

  routes.get("/", async (c) => {
    const user = c.get("appUser")!;
    if (!user.dashboardEnabled) {
      throw new ApiError({
        code: "DASHBOARD_NOT_ENABLED",
        message: "Complete onboarding before opening the dashboard.",
        status: 403,
      });
    }

    const db = createDrizzleDb(c.env.DB);
    const [application, payment] = await Promise.all([
      findApplicationByUserId(db, user.id),
      findPaymentByUserId(db, user.id),
    ]);

    return c.json({ user, application, payment });
  });

  return routes;
}
