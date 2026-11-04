import type { ApplicationStatus } from "@foran/config";
import type { StoreApplication, User } from "@foran/contracts";

const API_BASE = "/v1";

let currentSessionToken: string | null = null;
let currentCsrfToken: string | null = null;

export function setSessionToken(token: string | null, csrfToken: string | null = null) {
  currentSessionToken = token;
  currentCsrfToken = csrfToken;
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem("admin_session_token", token);
      if (csrfToken) sessionStorage.setItem("admin_csrf_token", csrfToken);
    } else {
      sessionStorage.removeItem("admin_session_token");
      sessionStorage.removeItem("admin_csrf_token");
    }
  }
}

export function getStoredSessionToken(): string | null {
  if (currentSessionToken) return currentSessionToken;
  if (typeof window !== "undefined") {
    currentSessionToken = sessionStorage.getItem("admin_session_token");
    currentCsrfToken = sessionStorage.getItem("admin_csrf_token");
  }
  return currentSessionToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredSessionToken();
  const headers = new Headers(options.headers || {});

  headers.set("X-Foran-Portal", "admin");

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
    const errorPayload = payload as { error?: { message?: string } } | null;
    throw new Error(errorPayload?.error?.message || "Admin request failed");
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
    body: JSON.stringify({ credential, portal: "admin" }),
  });
  if (data.user.role !== "admin") {
    throw new Error("Access denied: You must be a registered administrator.");
  }
  setSessionToken(data.sessionToken, data.csrfToken);
  return data.user;
}

export async function getSession(): Promise<User | null> {
  const token = getStoredSessionToken();
  if (!token) return null;
  try {
    const data = await request<{ user: User }>("/auth/session?portal=admin");
    if (data.user.role !== "admin") return null;
    return data.user;
  } catch {
    setSessionToken(null);
    return null;
  }
}

export async function listApplications(status?: ApplicationStatus): Promise<StoreApplication[]> {
  const query = status ? `?status=${status}` : "";
  const data = await request<{ applications: StoreApplication[] }>(`/admin/applications${query}`);
  return data.applications;
}

export async function getApplication(id: string): Promise<StoreApplication> {
  const data = await request<{ application: StoreApplication }>(`/admin/applications/${id}`);
  return data.application;
}

export async function reviewApplication(
  id: string,
  decision: "APPROVE" | "REQUEST_CHANGES",
  note: string,
): Promise<StoreApplication> {
  const data = await request<{ application: StoreApplication }>(
    `/admin/applications/${id}/decision`,
    {
      method: "PATCH",
      body: JSON.stringify({ decision, note }),
    },
  );
  return data.application;
}

export async function downloadDocument(documentId: string, filename: string): Promise<void> {
  const token = getStoredSessionToken();
  const response = await fetch(`${API_BASE}/admin/documents/${documentId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to download document");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function signOut(): Promise<void> {
  try {
    await request<{ success: boolean }>("/auth/signout?portal=admin", {
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
