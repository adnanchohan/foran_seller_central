import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { DocumentUpload, documentTypes } from '../models/DocumentUpload.js';

mkdirSync(env.uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: env.uploadDirectory,
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  },
});

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const uploader = multer({
  storage,
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
    const document = await DocumentUpload.create({
      owner: request.appUser!._id,
      documentType,
      originalName: request.file.originalname,
      storedName: request.file.filename,
      mimeType: request.file.mimetype,
      size: request.file.size,
      path: request.file.path,
    });

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
