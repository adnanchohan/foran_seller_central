import type {
  ApplicationDraftInput,
  DashboardResponse,
  Payment,
  SellerPlan,
  StoreApplication,
  UploadedDocument,
  User,
} from "@foran/contracts";

const API_BASE = "/v1";
const PORTAL_NAME = "seller";
const TOKEN_KEY = "foran_seller_session_token";
const CSRF_KEY = "foran_seller_csrf_token";

let currentSessionToken: string | null = null;
let currentCsrfToken: string | null = null;

export function setSessionToken(token: string | null, csrfToken: string | null = null) {
  currentSessionToken = token;
  currentCsrfToken = csrfToken;
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      if (csrfToken) sessionStorage.setItem(CSRF_KEY, csrfToken);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(CSRF_KEY);
    }
  }
}

export function getStoredSessionToken(): string | null {
  if (currentSessionToken) return currentSessionToken;
  if (typeof window !== "undefined") {
    currentSessionToken = sessionStorage.getItem(TOKEN_KEY);
    currentCsrfToken = sessionStorage.getItem(CSRF_KEY);
  }
  return currentSessionToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredSessionToken();
  const headers = new Headers(options.headers || {});

  headers.set("X-Foran-Portal", PORTAL_NAME);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (currentCsrfToken) {
    headers.set("X-CSRF-Token", currentCsrfToken);
  }

  const isFormData = options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorPayload = payload as { error?: { message?: string; code?: string } } | null;
    const message = errorPayload?.error?.message || "An unexpected error occurred.";
    throw new Error(message);
  }

  return payload as T;
}

export async function signInWithGoogleCredential(credential: string): Promise<User> {
  const data = await request<{
    user: User;
    sessionToken: string;
    csrfToken: string;
    expiresAt: number;
  }>("/auth/google-session", {
    method: "POST",
    body: JSON.stringify({ credential, portal: PORTAL_NAME }),
  });
  setSessionToken(data.sessionToken, data.csrfToken);
  return data.user;
}

export async function getSession(): Promise<User | null> {
  const token = getStoredSessionToken();
  if (!token) return null;
  try {
    const data = await request<{ user: User }>("/auth/session?portal=seller");
    return data.user;
  } catch {
    setSessionToken(null);
    return null;
  }
}

export async function getMyApplication(): Promise<StoreApplication | null> {
  const data = await request<{ application: StoreApplication | null }>(
    "/onboarding/me/application",
  );
  return data.application;
}

export async function saveApplicationDraft(
  draft: ApplicationDraftInput,
): Promise<StoreApplication> {
  const data = await request<{ application: StoreApplication }>(
    "/onboarding/me/application/draft",
    {
      method: "PUT",
      body: JSON.stringify(draft),
    },
  );
  return data.application;
}

export async function submitApplication(): Promise<StoreApplication> {
  const data = await request<{ application: StoreApplication }>(
    "/onboarding/me/application/submit",
    {
      method: "POST",
    },
  );
  return data.application;
}

export async function selectPlan(plan: SellerPlan): Promise<User> {
  const data = await request<{ user: User }>("/onboarding/me/plan", {
    method: "PUT",
    body: JSON.stringify({ plan }),
  });
  return data.user;
}

export function getUploadViewUrl(uploadId: string): string {
  const token = getStoredSessionToken();
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${API_BASE}/uploads/${uploadId}/view${query}`;
}

export async function uploadDocument(file: File, documentType: string): Promise<UploadedDocument> {
  const form = new FormData();
  form.append("file", file);
  form.append("documentType", documentType);

  const data = await request<{ document: UploadedDocument }>("/uploads", {
    method: "POST",
    body: form,
  });
  return data.document;
}

export async function completePlaceholderPayment(): Promise<Payment> {
  const data = await request<{ payment: Payment }>("/payments/placeholder", {
    method: "POST",
  });
  return data.payment;
}

export async function getMyPayment(): Promise<Payment | null> {
  const data = await request<{ payment: Payment | null }>("/payments/me");
  return data.payment;
}

export async function getDashboard(): Promise<DashboardResponse> {
  return request<DashboardResponse>("/dashboard");
}

export async function signOut(): Promise<void> {
  try {
    await request<{ success: boolean }>("/auth/signout?portal=seller", {
      method: "POST",
    });
  } catch {
    // Ignore sign-out network error
  } finally {
    setSessionToken(null);
    if (typeof window !== "undefined" && window.google?.accounts?.id?.disableAutoSelect) {
      window.google.accounts.id.disableAutoSelect();
    }
  }
}
