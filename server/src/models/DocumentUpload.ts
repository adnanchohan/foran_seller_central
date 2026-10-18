import { Schema, model } from 'mongoose';

export const documentTypes = [
  'store-banner',
  'store-logo',
  'cnic-front',
  'cnic-back',
  'company-document',
] as const;

const documentUploadSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentType: { type: String, enum: documentTypes, required: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

documentUploadSchema.index({ owner: 1, documentType: 1, createdAt: -1 });

export const DocumentUpload = model('DocumentUpload', documentUploadSchema);
