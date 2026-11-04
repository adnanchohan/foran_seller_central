import { and, eq, gt } from "drizzle-orm";
import { sessions } from "@foran/db";
import { generateSecureToken, generateUuid } from "../security/tokens.js";
import type { Database } from "./db.js";
import type { SessionData } from "../types.js";

export async function createSession(
  db: Database,
  userId: string,
  ttlSeconds: number,
  now: number,
): Promise<SessionData> {
  const token = generateSecureToken(32);
  const csrfToken = generateSecureToken(16);
  const expiresAt = now + ttlSeconds * 1000;

  const [created] = await db
    .insert(sessions)
    .values({
      id: generateUuid(),
      userId,
      token,
      csrfToken,
      expiresAt,
      createdAt: now,
    })
    .returning();

  return created as SessionData;
}

export async function findSessionByToken(
  db: Database,
  token: string,
  now: number,
): Promise<SessionData | null> {
  const result = await db.query.sessions.findFirst({
    where: and(eq(sessions.token, token), gt(sessions.expiresAt, now)),
  });
  return (result as SessionData | undefined) ?? null;
}

export async function deleteSession(db: Database, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}
