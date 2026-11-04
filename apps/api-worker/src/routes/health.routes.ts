import { Hono } from "hono";
import type { AppEnv } from "../types.js";

export function createHealthRoutes() {
  const routes = new Hono<AppEnv>();

  routes.get("/health", (c) => {
    return c.json({ status: "ok", service: "foran-api-worker" });
  });

  routes.get("/ready", (c) => {
    return c.json({ ready: true });
  });

  return routes;
}
