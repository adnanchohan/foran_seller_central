import { Hono } from "hono";
import { z } from "zod";
import { SELLER_PLANS, SELLER_TYPES } from "@foran/config";
import {
  findApplicationByUserId,
  saveApplicationDraft,
  submitApplication,
} from "../data/applications-repository.js";
import { createDrizzleDb } from "../data/db.js";
import { countOwnedDocuments } from "../data/documents-repository.js";
import { updateUserPlan } from "../data/users-repository.js";
import { ApiError } from "../http/api-error.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { makeStoreSlug } from "../security/slug.js";
import type { AppDependencies, AppEnv } from "../types.js";

const draftSchema = z.object({
  sellerType: z.enum(SELLER_TYPES).optional(),
  storeName: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  description: z.string().trim().max(400).optional(),
  warehouseAddress: z.string().trim().max(250).optional(),
  pickupCity: z.string().trim().max(80).optional(),
  pickupArea: z.string().trim().max(100).optional(),
  pickupContactPerson: z.string().trim().max(100).optional(),
  pickupContactMobile: z.string().trim().max(20).optional(),
  cnicNumber: z.string().trim().max(20).optional(),
  bannerUploadId: z.string().nullable().optional(),
  logoUploadId: z.string().nullable().optional(),
  cnicFrontUploadId: z.string().nullable().optional(),
  cnicBackUploadId: z.string().nullable().optional(),
  companyDocumentUploadId: z.string().nullable().optional(),
});

const submitValidationSchema = z.object({
  sellerType: z.enum(SELLER_TYPES),
  storeName: z.string().trim().min(2).max(100),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().min(10).max(400),
  warehouseAddress: z.string().trim().min(5).max(250),
  pickupCity: z.string().trim().min(1).max(80),
  pickupArea: z.string().trim().min(2).max(100),
  pickupContactPerson: z.string().trim().min(2).max(100),
  pickupContactMobile: z.string().trim().min(10).max(20),
  cnicNumber: z.string().trim().min(5),
  logoUploadId: z.string().min(1, "Store logo is required"),
  cnicFrontUploadId: z.string().min(1, "CNIC front is required"),
  cnicBackUploadId: z.string().min(1, "CNIC back is required"),
  bannerUploadId: z.string().nullable().optional(),
  companyDocumentUploadId: z.string().nullable().optional(),
});

const planSchema = z.object({
  plan: z.enum(SELLER_PLANS),
});

const editableStatuses = new Set(["DRAFT", "CHANGES_REQUIRED"]);

export function createOnboardingRoutes(deps: AppDependencies = {}) {
  const routes = new Hono<AppEnv>();
  const now = deps.now ?? (() => Date.now());

  routes.use("*", createAuthMiddleware(deps));

  routes.get("/me/application", async (c) => {
    const user = c.get("appUser")!;
    const db = createDrizzleDb(c.env.DB);
    const application = await findApplicationByUserId(db, user.id);
    return c.json({ application });
  });

  routes.put("/me/application/draft", async (c) => {
    const user = c.get("appUser")!;
    const body = await c.req.json();
    const data = draftSchema.parse(body);

    const db = createDrizzleDb(c.env.DB);
    const existing = await findApplicationByUserId(db, user.id);
    if (existing && !editableStatuses.has(existing.status)) {
      throw new ApiError({
        code: "INVALID_STATE",
        message: "This application cannot be edited in its current state.",
        status: 409,
      });
    }

    const draft = {
      ...data,
      storeSlug: data.storeName ? makeStoreSlug(data.storeName, user.id) : undefined,
    };

    const application = await saveApplicationDraft(db, user.id, draft, now());
    return c.json({ application });
  });

  routes.post("/me/application/submit", async (c) => {
    const user = c.get("appUser")!;
    const db = createDrizzleDb(c.env.DB);
    const application = await findApplicationByUserId(db, user.id);

    if (!application) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Save the store application before submitting it.",
        status: 404,
      });
    }

    if (!editableStatuses.has(application.status)) {
      throw new ApiError({
        code: "INVALID_STATE",
        message: "This application has already been submitted.",
        status: 409,
      });
    }

    // Validate completeness
    submitValidationSchema.parse({
      sellerType: application.sellerType,
      storeName: application.storeName,
      category: application.category,
      description: application.description,
      warehouseAddress: application.warehouseAddress,
      pickupCity: application.pickupCity,
      pickupArea: application.pickupArea,
      pickupContactPerson: application.pickupContactPerson,
      pickupContactMobile: application.pickupContactMobile,
      cnicNumber: application.cnicNumber,
      logoUploadId: application.logoUploadId,
      cnicFrontUploadId: application.cnicFrontUploadId,
      cnicBackUploadId: application.cnicBackUploadId,
      bannerUploadId: application.bannerUploadId,
      companyDocumentUploadId: application.companyDocumentUploadId,
    });

    if (application.sellerType === "company" && !application.companyDocumentUploadId) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        message: "A company registration document is required for companies.",
        status: 400,
      });
    }

    // Verify ownership of uploaded documents
    const uploadIds = [
      application.bannerUploadId,
      application.logoUploadId,
      application.cnicFrontUploadId,
      application.cnicBackUploadId,
      application.companyDocumentUploadId,
    ].filter((id): id is string => Boolean(id));

    const ownedCount = await countOwnedDocuments(db, user.id, uploadIds);
    if (ownedCount !== uploadIds.length) {
      throw new ApiError({
        code: "INVALID_DOCUMENTS",
        message: "One or more uploaded documents are invalid or do not exist.",
        status: 400,
      });
    }

    const submitted = await submitApplication(db, application, user.id, now());
    return c.json({ application: submitted });
  });

  routes.put("/me/plan", async (c) => {
    const user = c.get("appUser")!;
    const body = await c.req.json();
    const { plan } = planSchema.parse(body);

    const db = createDrizzleDb(c.env.DB);
    const application = await findApplicationByUserId(db, user.id);
    if (application?.status !== "APPROVED") {
      throw new ApiError({
        code: "APPLICATION_NOT_APPROVED",
        message: "Your store application must be approved before selecting a plan.",
        status: 409,
      });
    }

    const updatedUser = await updateUserPlan(db, user.id, plan, now());
    return c.json({ user: updatedUser });
  });

  return routes;
}
