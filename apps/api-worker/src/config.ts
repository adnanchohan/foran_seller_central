import { z } from "zod";
import type { AppBindings } from "./types.js";

const envSchema = z.object({
  ADMIN_GOOGLE_SUBS: z.string().default(""),
  ADMIN_EMAILS: z.string().default(""),
  DASHBOARD_ORIGINS: z.string().default("http://localhost:5173"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_SELLER_CLIENT_ID: z.string().default(""),
  GOOGLE_ADMIN_CLIENT_ID: z.string().default(""),
  SESSION_TTL_SECONDS: z.coerce.number().default(3600),
  MAX_UPLOAD_MB: z.coerce.number().default(10),
  LOG_LEVEL: z.string().default("info"),
  NODE_ENV: z.string().default("development"),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export function parseEnv(bindings: AppBindings): ValidatedEnv {
  const defaultGoogleClientId = bindings.GOOGLE_CLIENT_ID || "";
  return envSchema.parse({
    ADMIN_GOOGLE_SUBS: bindings.ADMIN_GOOGLE_SUBS,
    ADMIN_EMAILS: bindings.ADMIN_EMAILS,
    DASHBOARD_ORIGINS: bindings.DASHBOARD_ORIGINS,
    GOOGLE_CLIENT_ID: defaultGoogleClientId,
    GOOGLE_SELLER_CLIENT_ID: bindings.GOOGLE_SELLER_CLIENT_ID || defaultGoogleClientId,
    GOOGLE_ADMIN_CLIENT_ID: bindings.GOOGLE_ADMIN_CLIENT_ID || defaultGoogleClientId,
    SESSION_TTL_SECONDS: bindings.SESSION_TTL_SECONDS,
    MAX_UPLOAD_MB: bindings.MAX_UPLOAD_MB,
    LOG_LEVEL: bindings.LOG_LEVEL,
    NODE_ENV: bindings.NODE_ENV,
  });
}
