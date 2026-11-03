import { Router } from 'express';
import { z } from 'zod';
import {
  countOwnedDocuments,
  getApplicationByUserId,
  saveApplicationDraft,
  submitApplication,
  updateUserPlan,
} from '../data/repository.js';
import { sellerPlans, type StoreApplication } from '../data/types.js';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { makeStoreSlug } from '../lib/slug.js';
import { authenticate } from '../middleware/authenticate.js';

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

function applicationPayload(application: StoreApplication) {
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
    bannerUpload:
      application.bannerUpload && typeof application.bannerUpload !== 'string'
        ? application.bannerUpload._id
        : application.bannerUpload,
    logoUpload:
      application.logoUpload && typeof application.logoUpload !== 'string'
        ? application.logoUpload._id
        : application.logoUpload,
    cnicFrontUpload:
      application.cnicFrontUpload && typeof application.cnicFrontUpload !== 'string'
        ? application.cnicFrontUpload._id
        : application.cnicFrontUpload,
    cnicBackUpload:
      application.cnicBackUpload && typeof application.cnicBackUpload !== 'string'
        ? application.cnicBackUpload._id
        : application.cnicBackUpload,
    companyDocumentUpload:
      application.companyDocumentUpload && typeof application.companyDocumentUpload !== 'string'
        ? application.companyDocumentUpload._id
        : application.companyDocumentUpload,
  };
}

async function assertOwnedUploads(userId: string, uploadIds: string[]) {
  const uniqueIds = [...new Set(uploadIds.filter(Boolean))];
  const ownedCount = await countOwnedDocuments(userId, uniqueIds);
  if (ownedCount !== uniqueIds.length) {
    throw new AppError(422, 'One or more uploaded documents are invalid.');
  }
}

export const onboardingRouter = Router();
onboardingRouter.use(authenticate);

onboardingRouter.get(
  '/me/application',
  asyncHandler(async (request, response) => {
    const application = await getApplicationByUserId(request.appUser!._id);
    response.json({ application });
  }),
);

onboardingRouter.put(
  '/me/application/draft',
  asyncHandler(async (request, response) => {
    const data = draftSchema.parse(request.body);
    const existing = await getApplicationByUserId(request.appUser!._id, false);
    if (existing && !editableStatuses.has(existing.status)) {
      throw new AppError(409, 'This application cannot be edited in its current state.');
    }
    const draft = { ...data };
    if (data.storeName) {
      draft.storeSlug = makeStoreSlug(data.storeName, request.firebaseUser!.uid);
    }
    const application = await saveApplicationDraft(request.appUser!._id, draft);
    response.json({ application });
  }),
);

onboardingRouter.post(
  '/me/application/submit',
  asyncHandler(async (request, response) => {
    const application = await getApplicationByUserId(request.appUser!._id);
    if (!application) {
      throw new AppError(404, 'Save the store application before submitting it.');
    }
    if (!editableStatuses.has(application.status)) {
      throw new AppError(409, 'This application has already been submitted.');
    }

    const payload = submitSchema.parse(applicationPayload(application));
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

    const submittedApplication = await submitApplication(application, request.appUser!._id);
    response.json({ application: submittedApplication });
  }),
);

onboardingRouter.put(
  '/me/plan',
  asyncHandler(async (request, response) => {
    const { plan } = planSchema.parse(request.body);
    const application = await getApplicationByUserId(request.appUser!._id, false);
    if (application?.status !== 'APPROVED') {
      throw new AppError(409, 'Your store application must be approved before selecting a plan.');
    }

    const user = await updateUserPlan(request.appUser!._id, plan);
    response.json({ user });
  }),
);
