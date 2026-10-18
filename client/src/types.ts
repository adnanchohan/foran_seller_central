export type UserRole = 'seller' | 'admin';
export type SellerPlan = 'BASIC' | 'PREMIUM';
export type ApplicationStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'CHANGES_REQUIRED'
  | 'APPROVED';

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
}

export interface UploadedDocument {
  _id?: string;
  id?: string;
  documentType: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface ReviewHistoryItem {
  status: ApplicationStatus;
  note: string;
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
  reviewNote: string;
  history: ReviewHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DemoPayment {
  _id: string;
  plan: SellerPlan;
  amount: number;
  currency: string;
  status: 'DEMO_COMPLETED';
  provider: 'NOT_INTEGRATED';
  notice: string;
  createdAt: string;
}
