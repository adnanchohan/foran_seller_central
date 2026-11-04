import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    googleSub: text("google_sub").notNull().unique(),
    email: text("email").notNull().unique(),
    displayName: text("display_name").notNull().default(""),
    photoUrl: text("photo_url").notNull().default(""),
    authProvider: text("auth_provider").notNull(),
    role: text("role", { enum: ["seller", "admin"] })
      .notNull()
      .default("seller"),
    plan: text("plan", { enum: ["BASIC", "PREMIUM"] }),
    dashboardEnabled: integer("dashboard_enabled", { mode: "boolean" }).notNull().default(false),
    lastSignedInAt: integer("last_signed_in_at", { mode: "number" }).notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [index("idx_users_role").on(table.role)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    csrfToken: text("csrf_token").notNull(),
    expiresAt: integer("expires_at", { mode: "number" }).notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => [index("idx_sessions_token").on(table.token)],
);

export const documentUploads = sqliteTable(
  "document_uploads",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    documentType: text("document_type", {
      enum: ["store-banner", "store-logo", "cnic-front", "cnic-back", "company-document"],
    }).notNull(),
    originalName: text("original_name").notNull(),
    storedName: text("stored_name").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    size: integer("size", { mode: "number" }).notNull(),
    storageKey: text("storage_key").notNull().unique(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [index("idx_document_uploads_owner").on(table.ownerId, table.documentType)],
);

export const storeApplications = sqliteTable(
  "store_applications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["DRAFT", "PENDING_REVIEW", "CHANGES_REQUIRED", "APPROVED"],
    })
      .notNull()
      .default("DRAFT"),
    version: integer("version", { mode: "number" }).notNull().default(1),
    sellerType: text("seller_type", { enum: ["individual", "company"] })
      .notNull()
      .default("individual"),
    storeName: text("store_name").notNull().default(""),
    storeSlug: text("store_slug").notNull().default(""),
    category: text("category").notNull().default(""),
    description: text("description").notNull().default(""),
    warehouseAddress: text("warehouse_address").notNull().default(""),
    pickupCity: text("pickup_city").notNull().default(""),
    pickupArea: text("pickup_area").notNull().default(""),
    pickupContactPerson: text("pickup_contact_person").notNull().default(""),
    pickupContactMobile: text("pickup_contact_mobile").notNull().default(""),
    cnicNumber: text("cnic_number").notNull().default(""),
    bannerUploadId: text("banner_upload_id").references(() => documentUploads.id, {
      onDelete: "set null",
    }),
    logoUploadId: text("logo_upload_id").references(() => documentUploads.id, {
      onDelete: "set null",
    }),
    cnicFrontUploadId: text("cnic_front_upload_id").references(() => documentUploads.id, {
      onDelete: "set null",
    }),
    cnicBackUploadId: text("cnic_back_upload_id").references(() => documentUploads.id, {
      onDelete: "set null",
    }),
    companyDocumentUploadId: text("company_document_upload_id").references(
      () => documentUploads.id,
      { onDelete: "set null" },
    ),
    submittedAt: integer("submitted_at", { mode: "number" }),
    reviewedAt: integer("reviewed_at", { mode: "number" }),
    reviewedBy: text("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewNote: text("review_note").notNull().default(""),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [
    index("idx_store_applications_status").on(table.status, table.submittedAt),
    index("idx_store_applications_slug").on(table.storeSlug),
  ],
);

export const applicationHistory = sqliteTable(
  "application_history",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    applicationId: text("application_id")
      .notNull()
      .references(() => storeApplications.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["DRAFT", "PENDING_REVIEW", "CHANGES_REQUIRED", "APPROVED"],
    }).notNull(),
    note: text("note").notNull().default(""),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id),
    version: integer("version", { mode: "number" }).notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => [index("idx_application_history_app").on(table.applicationId, table.createdAt)],
);

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan", { enum: ["BASIC", "PREMIUM"] }).notNull(),
  amount: integer("amount", { mode: "number" }).notNull(),
  currency: text("currency").notNull().default("PKR"),
  status: text("status").notNull().default("DEMO_COMPLETED"),
  provider: text("provider").notNull().default("NOT_INTEGRATED"),
  notice: text("notice").notNull(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
  updatedAt: integer("updated_at", { mode: "number" }).notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  application: one(storeApplications, {
    fields: [users.id],
    references: [storeApplications.userId],
  }),
  documents: many(documentUploads),
  sessions: many(sessions),
  payment: one(payments, {
    fields: [users.id],
    references: [payments.userId],
  }),
}));

export const storeApplicationsRelations = relations(storeApplications, ({ one, many }) => ({
  user: one(users, {
    fields: [storeApplications.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [storeApplications.reviewedBy],
    references: [users.id],
  }),
  bannerUpload: one(documentUploads, {
    fields: [storeApplications.bannerUploadId],
    references: [documentUploads.id],
  }),
  logoUpload: one(documentUploads, {
    fields: [storeApplications.logoUploadId],
    references: [documentUploads.id],
  }),
  cnicFrontUpload: one(documentUploads, {
    fields: [storeApplications.cnicFrontUploadId],
    references: [documentUploads.id],
  }),
  cnicBackUpload: one(documentUploads, {
    fields: [storeApplications.cnicBackUploadId],
    references: [documentUploads.id],
  }),
  companyDocumentUpload: one(documentUploads, {
    fields: [storeApplications.companyDocumentUploadId],
    references: [documentUploads.id],
  }),
  history: many(applicationHistory),
}));

export const applicationHistoryRelations = relations(applicationHistory, ({ one }) => ({
  application: one(storeApplications, {
    fields: [applicationHistory.applicationId],
    references: [storeApplications.id],
  }),
  actor: one(users, {
    fields: [applicationHistory.actorId],
    references: [users.id],
  }),
}));

export const documentUploadsRelations = relations(documentUploads, ({ one }) => ({
  owner: one(users, {
    fields: [documentUploads.ownerId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));
