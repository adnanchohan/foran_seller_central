import { Router } from 'express';
import { getApplicationByUserId, getPaymentByUserId } from '../data/repository.js';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    if (!request.appUser!.dashboardEnabled) {
      throw new AppError(403, 'Complete onboarding before opening the dashboard.');
    }
    const [application, payment] = await Promise.all([
      getApplicationByUserId(request.appUser!._id, false),
      getPaymentByUserId(request.appUser!._id),
    ]);
    response.json({ user: request.appUser, application, payment });
  }),
);
