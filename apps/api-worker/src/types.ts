import type { User } from "@foran/contracts";

export interface AppBindings {
  DB: D1Database;
  DOCUMENTS_BUCKET: R2Bucket;
  ADMIN_GOOGLE_SUBS?: string;
  ADMIN_EMAILS?: string;
  DASHBOARD_ORIGINS?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_SELLER_CLIENT_ID?: string;
  GOOGLE_ADMIN_CLIENT_ID?: string;
  SESSION_TTL_SECONDS?: string;
  MAX_UPLOAD_MB?: string;
  LOG_LEVEL?: string;
  NODE_ENV?: string;
}

export interface SessionData {
  id: string;
  userId: string;
  token: string;
  csrfToken: string;
  expiresAt: number;
  createdAt: number;
}

export interface AppVariables {
  requestId: string;
  appUser?: User;
  session?: SessionData;
}

export interface AppEnv {
  Bindings: AppBindings;
  Variables: AppVariables;
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  aud?: string;
}

export interface AppDependencies {
  now?: () => number;
  verifyGoogleIdentity?: (token: string, expectedAudience?: string) => Promise<GoogleIdentity>;
}
