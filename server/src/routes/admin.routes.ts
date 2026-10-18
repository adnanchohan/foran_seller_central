import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';
import { DocumentUpload } from '../models/DocumentUpload.js';
import { applicationStatuses, StoreApplication } from '../models/StoreApplication.js';

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
    const filter = status ? { status } : {};
    const applications = await StoreApplication.find(filter)
      .populate('user', 'email displayName photoUrl plan role')
      .sort({ submittedAt: 1, updatedAt: -1 })
      .lean();
    response.json({ applications });
  }),
);

adminRouter.get(
  '/applications/:applicationId',
  asyncHandler(async (request, response) => {
    const application = await StoreApplication.findById(request.params.applicationId)
      .populate('user', 'email displayName photoUrl plan role')
      .populate(
        'bannerUpload logoUpload cnicFrontUpload cnicBackUpload companyDocumentUpload',
        'documentType originalName mimeType size',
      )
      .populate('reviewedBy', 'email displayName')
      .lean();
    if (!application) throw new AppError(404, 'Application not found.');
    response.json({ application });
  }),
);

adminRouter.patch(
  '/applications/:applicationId/decision',
  asyncHandler(async (request, response) => {
    const { decision, note } = decisionSchema.parse(request.body);
    const application = await StoreApplication.findById(request.params.applicationId);
    if (!application) throw new AppError(404, 'Application not found.');
    if (application.status !== 'PENDING_REVIEW') {
      throw new AppError(409, 'Only pending applications can be reviewed.');
    }

    application.status = decision === 'APPROVE' ? 'APPROVED' : 'CHANGES_REQUIRED';
    application.reviewNote = note;
    application.reviewedAt = new Date();
    application.reviewedBy = request.appUser!._id;
    application.history.push({
      status: application.status,
      note,
      actor: request.appUser!._id,
      version: application.version,
      at: new Date(),
    });
    await application.save();
    response.json({ application });
  }),
);

adminRouter.get(
  '/documents/:documentId/download',
  asyncHandler(async (request, response) => {
    const document = await DocumentUpload.findById(request.params.documentId).select('+path');
    if (!document) throw new AppError(404, 'Document not found.');
    response.download(path.resolve(document.path), document.originalName);
  }),
);
