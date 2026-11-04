import { Hono } from "hono";
import { z } from "zod";
import { APPLICATION_STATUSES } from "@foran/config";
import {
  findApplicationById,
  listApplications,
  reviewApplication,
} from "../data/applications-repository.js";
import { createDrizzleDb } from "../data/db.js";
import { findDocumentById } from "../data/documents-repository.js";
import { ApiError } from "../http/api-error.js";
import { createAuthMiddleware, requireAdmin } from "../middleware/auth.js";
import type { AppDependencies, AppEnv } from "../types.js";

const listQuerySchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
});

const decisionSchema = z
  .object({
    decision: z.enum(["APPROVE", "REQUEST_CHANGES"]),
    note: z.string().trim().max(1000).default(""),
  })
  .superRefine((data, context) => {
    if (data.decision === "REQUEST_CHANGES" && data.note.length < 5) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "Explain the changes the seller needs to make (minimum 5 characters).",
      });
    }
  });

export function createAdminRoutes(deps: AppDependencies = {}) {
  const routes = new Hono<AppEnv>();
  const now = deps.now ?? (() => Date.now());

  routes.use("*", createAuthMiddleware(deps), requireAdmin);

  routes.get("/applications", async (c) => {
    const query = listQuerySchema.parse(c.req.query());
    const db = createDrizzleDb(c.env.DB);
    const applications = await listApplications(db, query.status);
    return c.json({ applications });
  });

  routes.get("/applications/:applicationId", async (c) => {
    const applicationId = c.req.param("applicationId");
    const db = createDrizzleDb(c.env.DB);
    const application = await findApplicationById(db, applicationId);
    if (!application) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Application not found.",
        status: 404,
      });
    }
    return c.json({ application });
  });

  routes.patch("/applications/:applicationId/decision", async (c) => {
    const applicationId = c.req.param("applicationId");
    const reviewer = c.get("appUser")!;
    const body = await c.req.json();
    const { decision, note } = decisionSchema.parse(body);

    const db = createDrizzleDb(c.env.DB);
    const application = await findApplicationById(db, applicationId);
    if (!application) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Application not found.",
        status: 404,
      });
    }

    if (application.status !== "PENDING_REVIEW") {
      throw new ApiError({
        code: "INVALID_STATE",
        message: "Only pending applications can be reviewed.",
        status: 409,
      });
    }

    const reviewed = await reviewApplication(db, {
      application,
      status: decision === "APPROVE" ? "APPROVED" : "CHANGES_REQUIRED",
      note,
      reviewerId: reviewer.id,
      now: now(),
    });

    return c.json({ application: reviewed });
  });

  routes.get("/documents/:documentId/download", async (c) => {
    const documentId = c.req.param("documentId");
    const db = createDrizzleDb(c.env.DB);
    const document = await findDocumentById(db, documentId);

    if (!document) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Document not found.",
        status: 404,
      });
    }

    if (!c.env.DOCUMENTS_BUCKET) {
      throw new ApiError({
        code: "STORAGE_UNAVAILABLE",
        message: "Storage bucket is not configured.",
        status: 503,
      });
    }

    const object = await c.env.DOCUMENTS_BUCKET.get(document.storageKey);
    if (!object) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Document file not found in storage.",
        status: 404,
      });
    }

    c.header("Content-Type", document.mimeType);
    c.header(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(document.originalName)}"`,
    );
    c.header("Cache-Control", "private, no-store");

    return c.body(object.body);
  });

  return routes;
}
