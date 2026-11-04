import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { parseEnv } from "../config.js";
import { createDrizzleDb } from "../data/db.js";
import { findSessionByToken } from "../data/sessions-repository.js";
import { findUserById, upsertUser } from "../data/users-repository.js";
import { ApiError } from "../http/api-error.js";
import type { AppDependencies, AppEnv } from "../types.js";

export function createAuthMiddleware(deps: AppDependencies = {}): MiddlewareHandler<AppEnv> {
  const now = deps.now ?? (() => Date.now());

  return async (c, next) => {
    const authHeader = c.req.header("authorization");
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    } else {
      const portalHeader = c.req.header("x-foran-portal");
      const portalQuery = c.req.query("portal");
      const isPortalAdmin =
        portalHeader === "admin" || portalQuery === "admin" || c.req.path.startsWith("/v1/admin");
      const isPortalSeller =
        portalHeader === "seller" ||
        portalQuery === "seller" ||
        c.req.path.startsWith("/v1/onboarding") ||
        c.req.path.startsWith("/v1/dashboard");

      if (isPortalAdmin) {
        token = getCookie(c, "foran_admin_session") || getCookie(c, "session_token");
      } else if (isPortalSeller) {
        token = getCookie(c, "foran_seller_session") || getCookie(c, "session_token");
      } else {
        token =
          getCookie(c, "foran_admin_session") ||
          getCookie(c, "foran_seller_session") ||
          getCookie(c, "session_token");
      }
    }

    if (!token) {
      throw new ApiError({
        code: "UNAUTHORIZED",
        message: "Authentication token is required",
        status: 401,
      });
    }

    const db = createDrizzleDb(c.env.DB);
    const session = await findSessionByToken(db, token, now());

    if (session) {
      const user = await findUserById(db, session.userId);
      if (!user) {
        throw new ApiError({
          code: "UNAUTHORIZED",
          message: "User session is invalid",
          status: 401,
        });
      }
      c.set("appUser", user);
      c.set("session", session);
      return next();
    }

    // Direct token authentication (e.g. Google/Firebase ID token or test token)
    if (deps.verifyGoogleIdentity) {
      try {
        const identity = await deps.verifyGoogleIdentity(token);
        const env = parseEnv(c.env);
        const adminSubs = env.ADMIN_GOOGLE_SUBS.split(",").map((s) => s.trim());
        const adminEmails = env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase());
        const isAdmin =
          adminSubs.includes(identity.sub) || adminEmails.includes(identity.email.toLowerCase());

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

        c.set("appUser", user);
        return next();
      } catch (err) {
        if (err instanceof ApiError) throw err;
      }
    }

    throw new ApiError({
      code: "UNAUTHORIZED",
      message: "Session is expired or invalid",
      status: 401,
    });
  };
}

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = c.get("appUser");
  if (!user || user.role !== "admin") {
    throw new ApiError({
      code: "FORBIDDEN",
      message: "Administrator access is required",
      status: 403,
    });
  }
  await next();
};
