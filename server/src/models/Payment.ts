import { Schema, model } from 'mongoose';
import { sellerPlans } from './User.js';

const paymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan: { type: String, enum: sellerPlans, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'PKR' },
    status: { type: String, enum: ['DEMO_COMPLETED'], default: 'DEMO_COMPLETED' },
    provider: { type: String, default: 'NOT_INTEGRATED' },
    notice: {
      type: String,
      default: 'Development placeholder only. No money was collected.',
    },
  },
  { timestamps: true },
);

export const Payment = model('Payment', paymentSchema);
