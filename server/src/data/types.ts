export const userRoles = ['seller', 'admin'] as const;
export const sellerPlans = ['BASIC', 'PREMIUM'] as const;
export const applicationStatuses = [
  'DRAFT',
  'PENDING_REVIEW',
  'CHANGES_REQUIRED',
  'APPROVED',
] as const;
export const documentTypes = [
  'store-banner',
  'store-logo',
  'cnic-front',
  'cnic-back',
  'company-document',
] as const;

export type UserRole = (typeof userRoles)[number];
export type SellerPlan = (typeof sellerPlans)[number];
export type ApplicationStatus = (typeof applicationStatuses)[number];
export type DocumentType = (typeof documentTypes)[number];

export interface AppUser {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoUrl: string;
  authProvider: string;
  role: UserRole;
  plan: SellerPlan | null;
  dashboardEnabled: boolean;
  lastSignedInAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedDocument {
  _id: string;
  id: string;
  owner: string;
  documentType: DocumentType;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  storageProvider: 'r2';
  storageKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewHistoryItem {
  status: ApplicationStatus;
  note: string;
  actor: string;
  version: number;
  at: string;
}

export interface StoreApplication {
  _id: string;
  user: AppUser | string;
  status: ApplicationStatus;
  version: number;
  sellerType: 'individual' | 'company';
  storeName: string;
  storeSlug: string;
  category: string;
  description: string;
  warehouseAddress: string;
  pickupCity: string;
  pickupArea: string;
  pickupContactPerson: string;
  pickupContactMobile: string;
  cnicNumber: string;
  bannerUpload: UploadedDocument | string | null;
  logoUpload: UploadedDocument | string | null;
  cnicFrontUpload: UploadedDocument | string | null;
  cnicBackUpload: UploadedDocument | string | null;
  companyDocumentUpload: UploadedDocument | string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: AppUser | string | null;
  reviewNote: string;
  history: ReviewHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DemoPayment {
  _id: string;
  user: string;
  plan: SellerPlan;
  amount: number;
  currency: string;
  status: 'DEMO_COMPLETED';
  provider: 'NOT_INTEGRATED';
  notice: string;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationDraft = Partial<
  Pick<
    StoreApplication,
    | 'sellerType'
    | 'storeName'
    | 'storeSlug'
    | 'category'
    | 'description'
    | 'warehouseAddress'
    | 'pickupCity'
    | 'pickupArea'
    | 'pickupContactPerson'
    | 'pickupContactMobile'
    | 'cnicNumber'
  > & {
    bannerUpload: string | null;
    logoUpload: string | null;
    cnicFrontUpload: string | null;
    cnicBackUpload: string | null;
    companyDocumentUpload: string | null;
  }
>;
