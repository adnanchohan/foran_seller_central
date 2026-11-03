import { Router } from 'express';
import {
  completePlaceholderPayment,
  getApplicationByUserId,
  getPaymentByUserId,
} from '../data/repository.js';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';

const planPrices = {
  BASIC: 5000,
  PREMIUM: 15999,
} as const;

export const paymentRouter = Router();
paymentRouter.use(authenticate);

paymentRouter.post(
  '/placeholder',
  asyncHandler(async (request, response) => {
    const application = await getApplicationByUserId(request.appUser!._id, false);
    if (application?.status !== 'APPROVED') {
      throw new AppError(409, 'Your store application must be approved first.');
    }
    if (!request.appUser!.plan) {
      throw new AppError(409, 'Select a plan before continuing to payment.');
    }

    const plan = request.appUser!.plan;
    const payment = await completePlaceholderPayment(
      request.appUser!._id,
      plan,
      planPrices[plan],
    );

    response.status(201).json({ payment });
  }),
);

paymentRouter.get(
  '/me',
  asyncHandler(async (request, response) => {
    const payment = await getPaymentByUserId(request.appUser!._id);
    response.json({ payment });
  }),
);
