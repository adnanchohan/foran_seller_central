import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { makeStoreSlug } from '../lib/slug.js';
import { authenticate } from '../middleware/authenticate.js';
import { DocumentUpload } from '../models/DocumentUpload.js';
import { StoreApplication } from '../models/StoreApplication.js';
import { sellerPlans, User } from '../models/User.js';

const applicationFieldsSchema = z.object({
  sellerType: z.enum(['individual', 'company']),
  storeName: z.string().trim().min(2).max(100),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().min(20).max(400),
  warehouseAddress: z.string().trim().min(8).max(250),
  pickupCity: z.string().trim().min(1).max(80),
  pickupArea: z.string().trim().min(2).max(100),
  pickupContactPerson: z.string().trim().min(2).max(100),
  pickupContactMobile: z.string().trim().min(10).max(20),
  cnicNumber: z.string().trim().regex(/^\d{5}-?\d{7}-?\d$/, 'Enter a valid CNIC number.'),
  bannerUpload: z.string().nullable().optional(),
  logoUpload: z.string().nullable(),
  cnicFrontUpload: z.string().nullable(),
  cnicBackUpload: z.string().nullable(),
  companyDocumentUpload: z.string().nullable().optional(),
});

const draftSchema = z.object({
  sellerType: z.enum(['individual', 'company']).optional(),
  storeName: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  description: z.string().trim().max(400).optional(),
  warehouseAddress: z.string().trim().max(250).optional(),
  pickupCity: z.string().trim().max(80).optional(),
  pickupArea: z.string().trim().max(100).optional(),
  pickupContactPerson: z.string().trim().max(100).optional(),
  pickupContactMobile: z.string().trim().max(20).optional(),
  cnicNumber: z.string().trim().max(15).optional(),
  bannerUpload: z.string().nullable().optional(),
  logoUpload: z.string().nullable().optional(),
  cnicFrontUpload: z.string().nullable().optional(),
  cnicBackUpload: z.string().nullable().optional(),
  companyDocumentUpload: z.string().nullable().optional(),
});
const submitSchema = applicationFieldsSchema.superRefine((data, context) => {
  if (!data.logoUpload) {
    context.addIssue({ code: 'custom', path: ['logoUpload'], message: 'Store logo is required.' });
  }
  if (!data.cnicFrontUpload || !data.cnicBackUpload) {
    context.addIssue({
      code: 'custom',
      path: ['cnicFrontUpload'],
      message: 'Both CNIC sides are required.',
    });
  }
  if (data.sellerType === 'company' && !data.companyDocumentUpload) {
    context.addIssue({
      code: 'custom',
      path: ['companyDocumentUpload'],
      message: 'A company registration document is required.',
    });
  }
});

const planSchema = z.object({ plan: z.enum(sellerPlans) });

const editableStatuses = new Set(['DRAFT', 'CHANGES_REQUIRED']);

function applicationPayload(application: Record<string, unknown>) {
  return {
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
    bannerUpload: application.bannerUpload ? String(application.bannerUpload) : null,
    logoUpload: application.logoUpload ? String(application.logoUpload) : null,
    cnicFrontUpload: application.cnicFrontUpload ? String(application.cnicFrontUpload) : null,
    cnicBackUpload: application.cnicBackUpload ? String(application.cnicBackUpload) : null,
    companyDocumentUpload: application.companyDocumentUpload
      ? String(application.companyDocumentUpload)
      : null,
  };
}

async function assertOwnedUploads(userId: string, uploadIds: string[]) {
  const uniqueIds = [...new Set(uploadIds.filter(Boolean))];
  const ownedCount = await DocumentUpload.countDocuments({
    _id: { $in: uniqueIds },
    owner: userId,
  });
  if (ownedCount !== uniqueIds.length) {
    throw new AppError(422, 'One or more uploaded documents are invalid.');
  }
}

export const onboardingRouter = Router();
onboardingRouter.use(authenticate);

onboardingRouter.get(
  '/me/application',
  asyncHandler(async (request, response) => {
    const application = await StoreApplication.findOne({ user: request.appUser!._id })
      .populate('bannerUpload logoUpload cnicFrontUpload cnicBackUpload companyDocumentUpload',
        'documentType originalName mimeType size')
      .lean();
    response.json({ application });
  }),
);

onboardingRouter.put(
  '/me/application/draft',
  asyncHandler(async (request, response) => {
    const data = draftSchema.parse(request.body);
    let application = await StoreApplication.findOne({ user: request.appUser!._id });

    if (!application) {
      application = new StoreApplication({ user: request.appUser!._id });
    }
    if (!editableStatuses.has(application.status)) {
      throw new AppError(409, 'This application cannot be edited in its current state.');
    }

    Object.assign(application, data);
    if (data.storeName) {
      application.storeSlug = makeStoreSlug(data.storeName, request.firebaseUser!.uid);
    }
    await application.save();
    response.json({ application });
  }),
);

onboardingRouter.post(
  '/me/application/submit',
  asyncHandler(async (request, response) => {
    const application = await StoreApplication.findOne({ user: request.appUser!._id });
    if (!application) {
      throw new AppError(404, 'Save the store application before submitting it.');
    }
    if (!editableStatuses.has(application.status)) {
      throw new AppError(409, 'This application has already been submitted.');
    }

    const payload = submitSchema.parse(applicationPayload(application.toObject()));
    await assertOwnedUploads(
      String(request.appUser!._id),
      [
        payload.bannerUpload,
        payload.logoUpload,
        payload.cnicFrontUpload,
        payload.cnicBackUpload,
        payload.companyDocumentUpload,
      ].filter((value): value is string => Boolean(value)),
    );

    const isResubmission = application.status === 'CHANGES_REQUIRED';
    if (isResubmission) application.version += 1;
    application.status = 'PENDING_REVIEW';
    application.submittedAt = new Date();
    application.reviewedAt = null;
    application.reviewedBy = null;
    application.reviewNote = '';
    application.history.push({
      status: 'PENDING_REVIEW',
      note: isResubmission ? 'Application resubmitted by seller.' : 'Application submitted by seller.',
      actor: request.appUser!._id,
      version: application.version,
      at: new Date(),
    });
    await application.save();
    response.json({ application });
  }),
);

onboardingRouter.put(
  '/me/plan',
  asyncHandler(async (request, response) => {
    const { plan } = planSchema.parse(request.body);
    const application = await StoreApplication.findOne({ user: request.appUser!._id });
    if (application?.status !== 'APPROVED') {
      throw new AppError(409, 'Your store application must be approved before selecting a plan.');
    }

    const user = await User.findByIdAndUpdate(
      request.appUser!._id,
      { $set: { plan } },
      { new: true },
    );
    response.json({ user });
  }),
);
