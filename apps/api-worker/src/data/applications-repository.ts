import { and, desc, eq } from "drizzle-orm";
import type { ApplicationStatus } from "@foran/config";
import type { ApplicationDraftInput, StoreApplication } from "@foran/contracts";
import { applicationHistory, storeApplications } from "@foran/db";
import { generateUuid } from "../security/tokens.js";
import type { Database } from "./db.js";

export async function findApplicationByUserId(
  db: Database,
  userId: string,
): Promise<StoreApplication | null> {
  const result = await db.query.storeApplications.findFirst({
    where: eq(storeApplications.userId, userId),
    with: {
      bannerUpload: true,
      logoUpload: true,
      cnicFrontUpload: true,
      cnicBackUpload: true,
      companyDocumentUpload: true,
      history: true,
    },
  });
  return (result as unknown as StoreApplication | undefined) ?? null;
}

export async function findApplicationById(
  db: Database,
  id: string,
): Promise<StoreApplication | null> {
  const result = await db.query.storeApplications.findFirst({
    where: eq(storeApplications.id, id),
    with: {
      bannerUpload: true,
      logoUpload: true,
      cnicFrontUpload: true,
      cnicBackUpload: true,
      companyDocumentUpload: true,
      history: true,
    },
  });
  return (result as unknown as StoreApplication | undefined) ?? null;
}

export async function listApplications(
  db: Database,
  status?: ApplicationStatus,
): Promise<StoreApplication[]> {
  const results = await db.query.storeApplications.findMany({
    where: status ? eq(storeApplications.status, status) : undefined,
    orderBy: [desc(storeApplications.submittedAt), desc(storeApplications.updatedAt)],
    with: {
      bannerUpload: true,
      logoUpload: true,
      cnicFrontUpload: true,
      cnicBackUpload: true,
      companyDocumentUpload: true,
      history: true,
    },
  });
  return results as unknown as StoreApplication[];
}

export async function saveApplicationDraft(
  db: Database,
  userId: string,
  data: ApplicationDraftInput & { storeSlug?: string },
  now: number,
): Promise<StoreApplication> {
  const existing = await findApplicationByUserId(db, userId);

  if (existing) {
    await db
      .update(storeApplications)
      .set({
        sellerType: data.sellerType ?? existing.sellerType,
        storeName: data.storeName ?? existing.storeName,
        storeSlug: data.storeSlug ?? existing.storeSlug,
        category: data.category ?? existing.category,
        description: data.description ?? existing.description,
        warehouseAddress: data.warehouseAddress ?? existing.warehouseAddress,
        pickupCity: data.pickupCity ?? existing.pickupCity,
        pickupArea: data.pickupArea ?? existing.pickupArea,
        pickupContactPerson: data.pickupContactPerson ?? existing.pickupContactPerson,
        pickupContactMobile: data.pickupContactMobile ?? existing.pickupContactMobile,
        cnicNumber: data.cnicNumber ?? existing.cnicNumber,
        bannerUploadId:
          data.bannerUploadId !== undefined ? data.bannerUploadId : existing.bannerUploadId,
        logoUploadId: data.logoUploadId !== undefined ? data.logoUploadId : existing.logoUploadId,
        cnicFrontUploadId:
          data.cnicFrontUploadId !== undefined
            ? data.cnicFrontUploadId
            : existing.cnicFrontUploadId,
        cnicBackUploadId:
          data.cnicBackUploadId !== undefined ? data.cnicBackUploadId : existing.cnicBackUploadId,
        companyDocumentUploadId:
          data.companyDocumentUploadId !== undefined
            ? data.companyDocumentUploadId
            : existing.companyDocumentUploadId,
        updatedAt: now,
      })
      .where(eq(storeApplications.id, existing.id));

    return (await findApplicationById(db, existing.id))!;
  }

  const id = generateUuid();
  await db.insert(storeApplications).values({
    id,
    userId,
    sellerType: data.sellerType ?? "individual",
    storeName: data.storeName ?? "",
    storeSlug: data.storeSlug ?? "",
    category: data.category ?? "",
    description: data.description ?? "",
    warehouseAddress: data.warehouseAddress ?? "",
    pickupCity: data.pickupCity ?? "",
    pickupArea: data.pickupArea ?? "",
    pickupContactPerson: data.pickupContactPerson ?? "",
    pickupContactMobile: data.pickupContactMobile ?? "",
    cnicNumber: data.cnicNumber ?? "",
    bannerUploadId: data.bannerUploadId ?? null,
    logoUploadId: data.logoUploadId ?? null,
    cnicFrontUploadId: data.cnicFrontUploadId ?? null,
    cnicBackUploadId: data.cnicBackUploadId ?? null,
    companyDocumentUploadId: data.companyDocumentUploadId ?? null,
    status: "DRAFT",
    version: 1,
    createdAt: now,
    updatedAt: now,
  });

  return (await findApplicationById(db, id))!;
}

export async function submitApplication(
  db: Database,
  application: StoreApplication,
  actorId: string,
  now: number,
): Promise<StoreApplication> {
  const isResubmission = application.status === "CHANGES_REQUIRED";
  const version = isResubmission ? application.version + 1 : application.version;

  await db
    .update(storeApplications)
    .set({
      status: "PENDING_REVIEW",
      version,
      submittedAt: now,
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: "",
      updatedAt: now,
    })
    .where(eq(storeApplications.id, application.id));

  await db.insert(applicationHistory).values({
    applicationId: application.id,
    status: "PENDING_REVIEW",
    note: isResubmission
      ? "Application resubmitted by seller."
      : "Application submitted by seller.",
    actorId,
    version,
    createdAt: now,
  });

  return (await findApplicationById(db, application.id))!;
}

export async function reviewApplication(
  db: Database,
  input: {
    application: StoreApplication;
    status: "APPROVED" | "CHANGES_REQUIRED";
    note: string;
    reviewerId: string;
    now: number;
  },
): Promise<StoreApplication> {
  await db
    .update(storeApplications)
    .set({
      status: input.status,
      reviewNote: input.note,
      reviewedAt: input.now,
      reviewedBy: input.reviewerId,
      updatedAt: input.now,
    })
    .where(
      and(
        eq(storeApplications.id, input.application.id),
        eq(storeApplications.status, "PENDING_REVIEW"),
      ),
    );

  await db.insert(applicationHistory).values({
    applicationId: input.application.id,
    status: input.status,
    note: input.note,
    actorId: input.reviewerId,
    version: input.application.version,
    createdAt: input.now,
  });

  return (await findApplicationById(db, input.application.id))!;
}
