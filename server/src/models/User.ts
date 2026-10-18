import { Schema, model, type InferSchemaType } from 'mongoose';

export const userRoles = ['seller', 'admin'] as const;
export const sellerPlans = ['BASIC', 'PREMIUM'] as const;

const userSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    displayName: { type: String, default: '', trim: true },
    photoUrl: { type: String, default: '' },
    authProvider: { type: String, required: true },
    role: { type: String, enum: userRoles, default: 'seller', index: true },
    plan: { type: String, enum: sellerPlans, default: null },
    dashboardEnabled: { type: Boolean, default: false },
    lastSignedInAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export type UserRecord = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
