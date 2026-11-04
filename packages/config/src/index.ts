export const SELLER_PLANS = ["BASIC", "PREMIUM"] as const;
export type SellerPlan = (typeof SELLER_PLANS)[number];

export const PLAN_PRICING: Record<SellerPlan, { amount: number; currency: string; label: string }> =
  {
    BASIC: {
      amount: 5000,
      currency: "PKR",
      label: "Basic",
    },
    PREMIUM: {
      amount: 15999,
      currency: "PKR",
      label: "Premium",
    },
  };

export const APPLICATION_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "CHANGES_REQUIRED",
  "APPROVED",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const SELLER_TYPES = ["individual", "company"] as const;
export type SellerType = (typeof SELLER_TYPES)[number];

export const DOCUMENT_TYPES = [
  "store-banner",
  "store-logo",
  "cnic-front",
  "cnic-back",
  "company-document",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const ALLOWED_DOCUMENT_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
export type AllowedDocumentMimeType = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];

export const USER_ROLES = ["seller", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MAX_UPLOAD_MB = 10;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const DEFAULT_SESSION_TTL_SECONDS = 3600;

export const PORTALS = ["admin", "seller"] as const;
export type Portal = (typeof PORTALS)[number];
