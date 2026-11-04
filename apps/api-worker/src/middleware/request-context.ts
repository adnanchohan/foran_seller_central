import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types.js";

export const requestContextMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  c.set("requestId", requestId);
  await next();
  c.header("x-request-id", requestId);
};
