import type {
  ApplicationStatus,
  DocumentType,
  SellerPlan,
  SellerType,
  UserRole,
} from "@foran/config";

export interface User {
  id: string;
  googleSub: string;
  email: string;
  displayName: string;
  photoUrl: string;
  authProvider: string;
  role: UserRole;
  plan: SellerPlan | null;
  dashboardEnabled: boolean;
  lastSignedInAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface UploadedDocument {
  id: string;
  ownerId: string;
  documentType: DocumentType;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  createdAt: number;
  updatedAt: number;
}

export interface ApplicationHistoryItem {
  id: number;
  applicationId: string;
  status: ApplicationStatus;
  note: string;
  actorId: string;
  version: number;
  createdAt: number;
}

export interface StoreApplication {
  id: string;
  userId: string;
  status: ApplicationStatus;
  version: number;
  sellerType: SellerType;
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
  bannerUploadId: string | null;
  logoUploadId: string | null;
  cnicFrontUploadId: string | null;
  cnicBackUploadId: string | null;
  companyDocumentUploadId: string | null;
  bannerUpload?: UploadedDocument | null;
  logoUpload?: UploadedDocument | null;
  cnicFrontUpload?: UploadedDocument | null;
  cnicBackUpload?: UploadedDocument | null;
  companyDocumentUpload?: UploadedDocument | null;
  submittedAt: number | null;
  reviewedAt: number | null;
  reviewedBy: string | null;
  reviewNote: string;
  history?: ApplicationHistoryItem[];
  createdAt: number;
  updatedAt: number;
}

export interface ApplicationDraftInput {
  sellerType?: SellerType;
  storeName?: string;
  category?: string;
  description?: string;
  warehouseAddress?: string;
  pickupCity?: string;
  pickupArea?: string;
  pickupContactPerson?: string;
  pickupContactMobile?: string;
  cnicNumber?: string;
  bannerUploadId?: string | null;
  logoUploadId?: string | null;
  cnicFrontUploadId?: string | null;
  cnicBackUploadId?: string | null;
  companyDocumentUploadId?: string | null;
}

export interface Payment {
  id: string;
  userId: string;
  plan: SellerPlan;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  notice: string;
  createdAt: number;
  updatedAt: number;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
}

export type PortalType = "admin" | "seller";

export interface GoogleSessionRequest {
  credential: string;
  portal?: PortalType;
}

export interface SignOutResponse {
  success: boolean;
}

export interface AuthSessionResponse {
  user: User;
  csrfToken?: string;
  sessionToken?: string;
  expiresAt?: number;
}

export interface DashboardResponse {
  user: User;
  application: StoreApplication | null;
  payment: Payment | null;
}

export * from "@foran/config";
