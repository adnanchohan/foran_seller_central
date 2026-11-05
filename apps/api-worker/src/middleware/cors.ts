import type { MiddlewareHandler } from "hono";
import { parseEnv } from "../config.js";
import type { AppEnv } from "../types.js";

export const corsMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const origin = c.req.header("origin");
  const env = parseEnv(c.env);
  const allowedOrigins = env.DASHBOARD_ORIGINS.split(",").map((o) => o.trim());

  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes("*"))) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Access-Control-Allow-Credentials", "true");
    c.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, X-Request-Id, X-CSRF-Token, X-Foran-Portal",
    );
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  }

  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }

  await next();
};
