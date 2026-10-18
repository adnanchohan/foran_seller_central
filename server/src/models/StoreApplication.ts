import { Schema, model } from 'mongoose';

export const applicationStatuses = [
  'DRAFT',
  'PENDING_REVIEW',
  'CHANGES_REQUIRED',
  'APPROVED',
] as const;

const reviewHistorySchema = new Schema(
  {
    status: { type: String, enum: applicationStatuses, required: true },
    note: { type: String, default: '' },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const storeApplicationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    status: { type: String, enum: applicationStatuses, default: 'DRAFT', index: true },
    version: { type: Number, default: 1 },
    sellerType: { type: String, enum: ['individual', 'company'], default: 'individual' },
    storeName: { type: String, default: '', trim: true },
    storeSlug: { type: String, default: '', trim: true, index: true },
    category: { type: String, default: '' },
    description: { type: String, default: '', maxlength: 400 },
    warehouseAddress: { type: String, default: '' },
    pickupCity: { type: String, default: '' },
    pickupArea: { type: String, default: '' },
    pickupContactPerson: { type: String, default: '' },
    pickupContactMobile: { type: String, default: '' },
    cnicNumber: { type: String, default: '' },
    bannerUpload: { type: Schema.Types.ObjectId, ref: 'DocumentUpload', default: null },
    logoUpload: { type: Schema.Types.ObjectId, ref: 'DocumentUpload', default: null },
    cnicFrontUpload: { type: Schema.Types.ObjectId, ref: 'DocumentUpload', default: null },
    cnicBackUpload: { type: Schema.Types.ObjectId, ref: 'DocumentUpload', default: null },
    companyDocumentUpload: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentUpload',
      default: null,
    },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, default: '' },
    history: { type: [reviewHistorySchema], default: [] },
  },
  { timestamps: true },
);

storeApplicationSchema.index({ status: 1, submittedAt: 1 });

export const StoreApplication = model('StoreApplication', storeApplicationSchema);
