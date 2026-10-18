import { Router } from 'express';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { Payment } from '../models/Payment.js';
import { StoreApplication } from '../models/StoreApplication.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    if (!request.appUser!.dashboardEnabled) {
      throw new AppError(403, 'Complete onboarding before opening the dashboard.');
    }
    const [application, payment] = await Promise.all([
      StoreApplication.findOne({ user: request.appUser!._id }).lean(),
      Payment.findOne({ user: request.appUser!._id }).lean(),
    ]);
    response.json({ user: request.appUser, application, payment });
  }),
);
