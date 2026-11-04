import { Hono } from "hono";
import { PLAN_PRICING } from "@foran/config";
import { findApplicationByUserId } from "../data/applications-repository.js";
import { createDrizzleDb } from "../data/db.js";
import { createDemoPayment, findPaymentByUserId } from "../data/payments-repository.js";
import { ApiError } from "../http/api-error.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import type { AppDependencies, AppEnv } from "../types.js";

export function createPaymentRoutes(deps: AppDependencies = {}) {
  const routes = new Hono<AppEnv>();
  const now = deps.now ?? (() => Date.now());

  routes.use("*", createAuthMiddleware(deps));

  routes.post("/placeholder", async (c) => {
    const user = c.get("appUser")!;
    const db = createDrizzleDb(c.env.DB);

    const application = await findApplicationByUserId(db, user.id);
    if (application?.status !== "APPROVED") {
      throw new ApiError({
        code: "APPLICATION_NOT_APPROVED",
        message: "Your store application must be approved first.",
        status: 409,
      });
    }

    if (!user.plan) {
      throw new ApiError({
        code: "NO_PLAN_SELECTED",
        message: "Select a plan before continuing to payment.",
        status: 409,
      });
    }

    const priceInfo = PLAN_PRICING[user.plan];
    const payment = await createDemoPayment(db, user.id, user.plan, priceInfo.amount, now());

    return c.json({ payment }, 201);
  });

  routes.get("/me", async (c) => {
    const user = c.get("appUser")!;
    const db = createDrizzleDb(c.env.DB);
    const payment = await findPaymentByUserId(db, user.id);
    return c.json({ payment });
  });

  return routes;
}
