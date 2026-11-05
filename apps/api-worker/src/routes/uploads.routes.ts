import { Hono } from "hono";
import { z } from "zod";
import { ALLOWED_DOCUMENT_MIME_TYPES, DOCUMENT_TYPES, MAX_UPLOAD_BYTES } from "@foran/config";
import { createDrizzleDb } from "../data/db.js";
import { createDocument, findDocumentById } from "../data/documents-repository.js";
import { ApiError } from "../http/api-error.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { generateSecureToken } from "../security/tokens.js";
import type { AppDependencies, AppEnv } from "../types.js";

const documentTypeSchema = z.enum(DOCUMENT_TYPES);

export function createUploadRoutes(deps: AppDependencies = {}) {
  const routes = new Hono<AppEnv>();
  const now = deps.now ?? (() => Date.now());

  routes.use("*", createAuthMiddleware(deps));

  routes.post("/", async (c) => {
    const user = c.get("appUser")!;
    const formData = await c.req.formData();
    const file = formData.get("file");
    const rawDocType = formData.get("documentType");

    if (!file || typeof file === "string") {
      throw new ApiError({
        code: "MISSING_FILE",
        message: "Choose a document to upload.",
        status: 400,
      });
    }

    const documentType = documentTypeSchema.parse(rawDocType);
    const mimeType = file.type;

    if (
      !ALLOWED_DOCUMENT_MIME_TYPES.includes(
        mimeType as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number],
      )
    ) {
      throw new ApiError({
        code: "INVALID_MIME_TYPE",
        message: "Only JPG, PNG, and PDF documents are accepted.",
        status: 422,
      });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new ApiError({
        code: "FILE_TOO_LARGE",
        message: "Uploaded file exceeds maximum allowed size (10MB).",
        status: 422,
      });
    }

    const extension = file.name.split(".").pop() || "bin";
    const storedName = `${generateSecureToken(16)}.${extension}`;
    const storageKey = `sellers/${user.id}/${documentType}/${storedName}`;

    const arrayBuffer = await file.arrayBuffer();

    // Store in R2 bucket if available
    if (c.env.DOCUMENTS_BUCKET) {
      await c.env.DOCUMENTS_BUCKET.put(storageKey, arrayBuffer, {
        httpMetadata: {
          contentType: mimeType,
        },
      });
    }

    const db = createDrizzleDb(c.env.DB);
    const document = await createDocument(
      db,
      {
        ownerId: user.id,
        documentType,
        originalName: file.name,
        storedName,
        mimeType,
        size: file.size,
        storageKey,
      },
      now(),
    );

    return c.json({ document }, 201);
  });

  routes.get("/:id/view", async (c) => {
    const user = c.get("appUser")!;
    const id = c.req.param("id");
    const db = createDrizzleDb(c.env.DB);
    const document = await findDocumentById(db, id);

    if (!document || (document.ownerId !== user.id && user.role !== "admin")) {
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
        message: "File not found in storage.",
        status: 404,
      });
    }

    c.header("Content-Type", document.mimeType);
    c.header(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(document.originalName)}"`,
    );
    c.header("Cache-Control", "private, max-age=3600");

    return c.body(object.body);
  });

  return routes;
}
