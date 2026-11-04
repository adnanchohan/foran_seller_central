import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error.js";
import { requestContextMiddleware } from "./middleware/request-context.js";
import { createAdminRoutes } from "./routes/admin.routes.js";
import { createAuthRoutes } from "./routes/auth.routes.js";
import { createDashboardRoutes } from "./routes/dashboard.routes.js";
import { createHealthRoutes } from "./routes/health.routes.js";
import { createOnboardingRoutes } from "./routes/onboarding.routes.js";
import { createPaymentRoutes } from "./routes/payments.routes.js";
import { createUploadRoutes } from "./routes/uploads.routes.js";
import type { AppDependencies, AppEnv } from "./types.js";

export function createApp(deps: AppDependencies = {}) {
  const app = new Hono<AppEnv>();

  // Global Middleware
  app.use("*", requestContextMiddleware);
  app.use("*", corsMiddleware);
  app.onError(errorHandler);

  // Health and readiness probes
  const healthRoutes = createHealthRoutes();
  app.route("/", healthRoutes);
  app.route("/v1", healthRoutes);

  // Sub-routers
  const authRoutes = createAuthRoutes(deps);
  const onboardingRoutes = createOnboardingRoutes(deps);
  const uploadRoutes = createUploadRoutes(deps);
  const paymentRoutes = createPaymentRoutes(deps);
  const dashboardRoutes = createDashboardRoutes(deps);
  const adminRoutes = createAdminRoutes(deps);

  // Mount at /v1 and also at /api/v1 (or root) for compatibility
  const v1 = new Hono<AppEnv>();
  v1.route("/auth", authRoutes);
  v1.route("/onboarding", onboardingRoutes);
  v1.route("/uploads", uploadRoutes);
  v1.route("/payments", paymentRoutes);
  v1.route("/dashboard", dashboardRoutes);
  v1.route("/admin", adminRoutes);

  app.route("/v1", v1);
  app.route("/api/v1", v1);

  return app;
}
