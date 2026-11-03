import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../config/env.js';
import { createDocument } from '../data/repository.js';
import { documentTypes } from '../data/types.js';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { deleteStoredDocument, storeDocument } from '../lib/documentStorage.js';
import { authenticate } from '../middleware/authenticate.js';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError(422, 'Only JPG, PNG, and PDF documents are accepted.'));
      return;
    }
    callback(null, true);
  },
});

const documentTypeSchema = z.enum(documentTypes);

export const uploadRouter = Router();
uploadRouter.use(authenticate);

uploadRouter.post(
  '/',
  uploader.single('file'),
  asyncHandler(async (request, response) => {
    if (!request.file) {
      throw new AppError(422, 'Choose a document to upload.');
    }

    const documentType = documentTypeSchema.parse(request.body.documentType);
    const stored = await storeDocument({
      ownerId: String(request.appUser!._id),
      documentType,
      originalName: request.file.originalname,
      mimeType: request.file.mimetype,
      bytes: request.file.buffer,
    });

    let document;
    try {
      document = await createDocument({
        ownerId: request.appUser!._id,
        documentType,
        originalName: request.file.originalname,
        storedName: stored.storedName,
        mimeType: request.file.mimetype,
        size: request.file.size,
        storageKey: stored.storageKey,
      });
    } catch (error) {
      await deleteStoredDocument(stored).catch((cleanupError) => console.error(cleanupError));
      throw error;
    }

    response.status(201).json({
      document: {
        id: document.id,
        documentType: document.documentType,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
      },
    });
  }),
);
