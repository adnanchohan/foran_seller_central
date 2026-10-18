import { Router } from 'express';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { Payment } from '../models/Payment.js';
import { StoreApplication } from '../models/StoreApplication.js';
import { User } from '../models/User.js';

const planPrices = {
  BASIC: 5000,
  PREMIUM: 15999,
} as const;

export const paymentRouter = Router();
paymentRouter.use(authenticate);

paymentRouter.post(
  '/placeholder',
  asyncHandler(async (request, response) => {
    const application = await StoreApplication.findOne({ user: request.appUser!._id });
    if (application?.status !== 'APPROVED') {
      throw new AppError(409, 'Your store application must be approved first.');
    }
    if (!request.appUser!.plan) {
      throw new AppError(409, 'Select a plan before continuing to payment.');
    }

    const plan = request.appUser!.plan;
    const payment = await Payment.findOneAndUpdate(
      { user: request.appUser!._id },
      {
        $set: {
          plan,
          amount: planPrices[plan],
          currency: 'PKR',
          status: 'DEMO_COMPLETED',
          provider: 'NOT_INTEGRATED',
          notice: 'Development placeholder only. No money was collected.',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    await User.findByIdAndUpdate(request.appUser!._id, {
      $set: { dashboardEnabled: true },
    });

    response.status(201).json({ payment });
  }),
);

paymentRouter.get(
  '/me',
  asyncHandler(async (request, response) => {
    const payment = await Payment.findOne({ user: request.appUser!._id }).lean();
    response.json({ payment });
  }),
);
