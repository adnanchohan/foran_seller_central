import { eq } from "drizzle-orm";
import type { SellerPlan, User, UserRole } from "@foran/contracts";
import { users } from "@foran/db";
import { generateUuid } from "../security/tokens.js";
import type { Database } from "./db.js";

export async function findUserById(db: Database, id: string): Promise<User | null> {
  const result = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  return (result as User | undefined) ?? null;
}

export async function findUserByGoogleSub(db: Database, sub: string): Promise<User | null> {
  const result = await db.query.users.findFirst({
    where: eq(users.googleSub, sub),
  });
  return (result as User | undefined) ?? null;
}

export async function findUserByEmail(db: Database, email: string): Promise<User | null> {
  const result = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });
  return (result as User | undefined) ?? null;
}

export async function upsertUser(
  db: Database,
  input: {
    googleSub: string;
    email: string;
    displayName: string;
    photoUrl: string;
    authProvider: string;
    role: UserRole;
  },
  now: number,
): Promise<User> {
  const existing = await findUserByGoogleSub(db, input.googleSub);
  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        email: input.email.toLowerCase().trim(),
        displayName: input.displayName,
        photoUrl: input.photoUrl,
        authProvider: input.authProvider,
        role: input.role,
        lastSignedInAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated as User;
  }

  const [created] = await db
    .insert(users)
    .values({
      id: generateUuid(),
      googleSub: input.googleSub,
      email: input.email.toLowerCase().trim(),
      displayName: input.displayName,
      photoUrl: input.photoUrl,
      authProvider: input.authProvider,
      role: input.role,
      plan: null,
      dashboardEnabled: false,
      lastSignedInAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return created as User;
}

export async function updateUserPlan(
  db: Database,
  userId: string,
  plan: SellerPlan,
  now: number,
): Promise<User> {
  const [updated] = await db
    .update(users)
    .set({
      plan,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();
  return updated as User;
}

export async function enableDashboard(db: Database, userId: string, now: number): Promise<User> {
  const [updated] = await db
    .update(users)
    .set({
      dashboardEnabled: true,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();
  return updated as User;
}
