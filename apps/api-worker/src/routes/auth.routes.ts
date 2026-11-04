import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { parseEnv } from "../config.js";
import { createDrizzleDb } from "../data/db.js";
import { createSession } from "../data/sessions-repository.js";
import { upsertUser } from "../data/users-repository.js";
import { ApiError } from "../http/api-error.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { defaultVerifyGoogleIdentity } from "../security/google-auth.js";
import type { AppDependencies, AppEnv } from "../types.js";

const googleSessionSchema = z.object({
  credential: z.string().min(1, "Credential token is required"),
  portal: z.enum(["admin", "seller"]).optional(),
});

export function createAuthRoutes(deps: AppDependencies = {}) {
  const routes = new Hono<AppEnv>();
  const now = deps.now ?? (() => Date.now());
  const verifyIdentity = deps.verifyGoogleIdentity ?? defaultVerifyGoogleIdentity;

  routes.get("/session", createAuthMiddleware(deps), (c) => {
    const user = c.get("appUser");
    const portalHeader = c.req.header("x-foran-portal");
    const portalQuery = c.req.query("portal");
    const isPortalAdmin = portalHeader === "admin" || portalQuery === "admin";

    if (isPortalAdmin && user?.role !== "admin") {
      throw new ApiError({
        code: "FORBIDDEN",
        message: "Administrator access is required",
        status: 403,
      });
    }

    return c.json({ user });
  });

  routes.post("/google-session", async (c) => {
    const body = await c.req.json();
    const { credential, portal: bodyPortal } = googleSessionSchema.parse(body);
    const headerPortal = c.req.header("x-foran-portal");
    const portal = bodyPortal || (headerPortal === "admin" ? "admin" : "seller");

    const env = parseEnv(c.env);
    const expectedAudience =
      portal === "admin"
        ? env.GOOGLE_ADMIN_CLIENT_ID || env.GOOGLE_CLIENT_ID || undefined
        : env.GOOGLE_SELLER_CLIENT_ID || env.GOOGLE_CLIENT_ID || undefined;

    const identity = await verifyIdentity(credential, expectedAudience);
    const adminSubs = env.ADMIN_GOOGLE_SUBS.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const adminEmails = env.ADMIN_EMAILS.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin =
      adminSubs.includes(identity.sub) || adminEmails.includes(identity.email.toLowerCase());

    if (portal === "admin" && !isAdmin) {
      throw new ApiError({
        code: "FORBIDDEN",
        message: "Access denied: This Google account does not have administrator privileges.",
        status: 403,
      });
    }

    const db = createDrizzleDb(c.env.DB);
    const user = await upsertUser(
      db,
      {
        googleSub: identity.sub,
        email: identity.email,
        displayName: identity.name ?? "",
        photoUrl: identity.picture ?? "",
        authProvider: "google.com",
        role: isAdmin ? "admin" : "seller",
      },
      now(),
    );

    const session = await createSession(db, user.id, env.SESSION_TTL_SECONDS, now());

    // Set portal-scoped cookie
    const cookieName = portal === "admin" ? "foran_admin_session" : "foran_seller_session";
    setCookie(c, cookieName, session.token, {
      path: "/",
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: env.SESSION_TTL_SECONDS,
    });

    return c.json({
      user,
      sessionToken: session.token,
      csrfToken: session.csrfToken,
      expiresAt: session.expiresAt,
    });
  });

  routes.post("/signout", (c) => {
    const portalHeader = c.req.header("x-foran-portal");
    const portalQuery = c.req.query("portal");
    const portal = portalHeader || portalQuery;

    if (portal === "admin") {
      deleteCookie(c, "foran_admin_session", { path: "/" });
    } else if (portal === "seller") {
      deleteCookie(c, "foran_seller_session", { path: "/" });
    } else {
      deleteCookie(c, "foran_admin_session", { path: "/" });
      deleteCookie(c, "foran_seller_session", { path: "/" });
      deleteCookie(c, "session_token", { path: "/" });
    }

    return c.json({ success: true });
  });

  return routes;
}
