import { randomUUID } from 'node:crypto';
import { getDocumentsBucket } from '../config/runtimeBindings.js';
import { AppError } from './AppError.js';

interface StoredDocumentReference {
  storageKey: string;
  storedName: string;
}

interface ReadableDocumentReference {
  storageKey?: string;
  storedName: string;
}

const extensionsByMimeType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
};

export async function storeDocument(input: {
  ownerId: string;
  documentType: string;
  originalName: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<StoredDocumentReference> {
  const extension = extensionsByMimeType[input.mimeType];
  if (!extension) throw new AppError(422, 'Unsupported document format.');

  const storedName = `${randomUUID()}${extension}`;
  const storageKey = `seller-documents/${input.ownerId}/${input.documentType}/${storedName}`;
  const bucket = getDocumentsBucket();
  if (!bucket) {
    throw new AppError(503, 'Cloudflare R2 document storage is unavailable.');
  }
  await bucket.put(storageKey, new Uint8Array(input.bytes), {
    httpMetadata: { contentType: input.mimeType },
    customMetadata: {
      ownerId: input.ownerId,
      documentType: input.documentType,
      originalName: input.originalName,
    },
  });
  return { storageKey, storedName };
}

export async function deleteStoredDocument(reference: StoredDocumentReference) {
  await getDocumentsBucket()?.delete(reference.storageKey);
}

export async function readStoredDocument(reference: ReadableDocumentReference) {
  const bucket = getDocumentsBucket();
  if (!bucket) throw new AppError(503, 'Cloudflare R2 document storage is unavailable.');
  const object = await bucket.get(reference.storageKey || reference.storedName);
  if (!object) throw new AppError(404, 'The stored document could not be found.');
  return Buffer.from(await object.arrayBuffer());
}
