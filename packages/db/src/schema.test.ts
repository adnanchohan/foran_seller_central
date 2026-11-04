import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  applicationHistory,
  documentUploads,
  payments,
  sessions,
  storeApplications,
  users,
} from "./schema.js";

describe("Database Schema Definitions", () => {
  it("verifies all core tables have valid columns defined", () => {
    const userCols = getTableColumns(users);
    expect(userCols.id).toBeDefined();
    expect(userCols.googleSub).toBeDefined();
    expect(userCols.email).toBeDefined();
    expect(userCols.role).toBeDefined();

    const sessionCols = getTableColumns(sessions);
    expect(sessionCols.id).toBeDefined();
    expect(sessionCols.token).toBeDefined();
    expect(sessionCols.csrfToken).toBeDefined();

    const docCols = getTableColumns(documentUploads);
    expect(docCols.id).toBeDefined();
    expect(docCols.ownerId).toBeDefined();
    expect(docCols.documentType).toBeDefined();

    const appCols = getTableColumns(storeApplications);
    expect(appCols.id).toBeDefined();
    expect(appCols.userId).toBeDefined();
    expect(appCols.status).toBeDefined();
    expect(appCols.storeSlug).toBeDefined();

    const historyCols = getTableColumns(applicationHistory);
    expect(historyCols.id).toBeDefined();
    expect(historyCols.applicationId).toBeDefined();
    expect(historyCols.status).toBeDefined();

    const paymentCols = getTableColumns(payments);
    expect(paymentCols.id).toBeDefined();
    expect(paymentCols.userId).toBeDefined();
    expect(paymentCols.amount).toBeDefined();
  });
});
