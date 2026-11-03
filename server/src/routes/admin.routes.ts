import { Router } from 'express';
import { z } from 'zod';
import {
  getApplicationById,
  getDocumentById,
  listApplications,
  reviewApplication,
} from '../data/repository.js';
import { applicationStatuses } from '../data/types.js';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { readStoredDocument } from '../lib/documentStorage.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';

const listQuerySchema = z.object({
  status: z.enum(applicationStatuses).optional(),
});

const decisionSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REQUEST_CHANGES']),
    note: z.string().trim().max(1000).default(''),
  })
  .superRefine((data, context) => {
    if (data.decision === 'REQUEST_CHANGES' && data.note.length < 5) {
      context.addIssue({
        code: 'custom',
        path: ['note'],
        message: 'Explain the changes the seller needs to make.',
      });
    }
  });

export const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

adminRouter.get(
  '/applications',
  asyncHandler(async (request, response) => {
    const { status } = listQuerySchema.parse(request.query);
    const applications = await listApplications(status);
    response.json({ applications });
  }),
);

adminRouter.get(
  '/applications/:applicationId',
  asyncHandler(async (request, response) => {
    const application = await getApplicationById(request.params.applicationId);
    if (!application) throw new AppError(404, 'Application not found.');
    response.json({ application });
  }),
);

adminRouter.patch(
  '/applications/:applicationId/decision',
  asyncHandler(async (request, response) => {
    const { decision, note } = decisionSchema.parse(request.body);
    const application = await getApplicationById(request.params.applicationId);
    if (!application) throw new AppError(404, 'Application not found.');
    if (application.status !== 'PENDING_REVIEW') {
      throw new AppError(409, 'Only pending applications can be reviewed.');
    }

    const updatedApplication = await reviewApplication({
      application,
      status: decision === 'APPROVE' ? 'APPROVED' : 'CHANGES_REQUIRED',
      note,
      reviewerId: request.appUser!._id,
    });
    response.json({ application: updatedApplication });
  }),
);

adminRouter.get(
  '/documents/:documentId/download',
  asyncHandler(async (request, response) => {
    const document = await getDocumentById(request.params.documentId);
    if (!document) throw new AppError(404, 'Document not found.');
    const bytes = await readStoredDocument({
      storageKey: document.storageKey,
      storedName: document.storedName,
    });
    response.setHeader('Cache-Control', 'private, no-store');
    response.type(document.mimeType);
    response.attachment(document.originalName);
    response.send(bytes);
  }),
);
