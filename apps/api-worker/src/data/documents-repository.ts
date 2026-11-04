import { and, eq, inArray } from "drizzle-orm";
import type { DocumentType } from "@foran/config";
import type { UploadedDocument } from "@foran/contracts";
import { documentUploads } from "@foran/db";
import { generateUuid } from "../security/tokens.js";
import type { Database } from "./db.js";

export async function createDocument(
  db: Database,
  input: {
    ownerId: string;
    documentType: DocumentType;
    originalName: string;
    storedName: string;
    mimeType: string;
    size: number;
    storageKey: string;
  },
  now: number,
): Promise<UploadedDocument> {
  const [created] = await db
    .insert(documentUploads)
    .values({
      id: generateUuid(),
      ownerId: input.ownerId,
      documentType: input.documentType,
      originalName: input.originalName,
      storedName: input.storedName,
      mimeType: input.mimeType,
      size: input.size,
      storageKey: input.storageKey,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return created as UploadedDocument;
}

export async function findDocumentById(db: Database, id: string): Promise<UploadedDocument | null> {
  const result = await db.query.documentUploads.findFirst({
    where: eq(documentUploads.id, id),
  });
  return (result as UploadedDocument | undefined) ?? null;
}

export async function countOwnedDocuments(
  db: Database,
  ownerId: string,
  documentIds: string[],
): Promise<number> {
  if (documentIds.length === 0) return 0;
  const results = await db.query.documentUploads.findMany({
    where: and(eq(documentUploads.ownerId, ownerId), inArray(documentUploads.id, documentIds)),
  });
  return results.length;
}
