import { eq } from "drizzle-orm";
import type { Payment, SellerPlan } from "@foran/contracts";
import { payments, users } from "@foran/db";
import { generateUuid } from "../security/tokens.js";
import type { Database } from "./db.js";

export async function findPaymentByUserId(db: Database, userId: string): Promise<Payment | null> {
  const result = await db.query.payments.findFirst({
    where: eq(payments.userId, userId),
  });
  return (result as Payment | undefined) ?? null;
}

export async function createDemoPayment(
  db: Database,
  userId: string,
  plan: SellerPlan,
  amount: number,
  now: number,
): Promise<Payment> {
  const notice = "Development placeholder only. No real money was collected.";
  const existing = await findPaymentByUserId(db, userId);

  if (existing) {
    const [updated] = await db
      .update(payments)
      .set({
        plan,
        amount,
        currency: "PKR",
        status: "DEMO_COMPLETED",
        provider: "NOT_INTEGRATED",
        notice,
        updatedAt: now,
      })
      .where(eq(payments.id, existing.id))
      .returning();

    await db
      .update(users)
      .set({
        dashboardEnabled: true,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    return updated as Payment;
  }

  const [created] = await db
    .insert(payments)
    .values({
      id: generateUuid(),
      userId,
      plan,
      amount,
      currency: "PKR",
      status: "DEMO_COMPLETED",
      provider: "NOT_INTEGRATED",
      notice,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db
    .update(users)
    .set({
      dashboardEnabled: true,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  return created as Payment;
}
