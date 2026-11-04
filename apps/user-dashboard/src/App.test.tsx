import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.js";
import * as api from "./api.js";

vi.mock("./api.js", () => ({
  getSession: vi.fn(),
  getMyApplication: vi.fn(),
  signInWithGoogleCredential: vi.fn(),
  signOut: vi.fn(),
  saveApplicationDraft: vi.fn(),
  submitApplication: vi.fn(),
  selectPlan: vi.fn(),
  completePlaceholderPayment: vi.fn(),
  uploadDocument: vi.fn(),
  getDashboard: vi.fn(),
  formatPath: vi.fn((route) => `/${route.name}`),
  parseRoute: vi.fn((path) => {
    if (path.includes("signin")) return { name: "signin" };
    if (path.includes("store")) return { name: "store" };
    if (path.includes("approval")) return { name: "approval" };
    if (path.includes("plans")) return { name: "plans" };
    if (path.includes("payment")) return { name: "payment" };
    if (path.includes("dashboard")) return { name: "dashboard" };
    return { name: "journey" };
  }),
}));

describe("User Dashboard App Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/");
    sessionStorage.clear();
  });

  it("renders sign in screen when user is unauthenticated", async () => {
    vi.mocked(api.getSession).mockResolvedValue(null);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Foran Seller Platform")).toBeDefined();
      expect(screen.getByText("Continue with Google")).toBeDefined();
    });
  });

  it("handles sign in journey and redirects to store profile", async () => {
    vi.mocked(api.getSession).mockResolvedValue(null);
    vi.mocked(api.signInWithGoogleCredential).mockResolvedValue({
      id: "u-1",
      googleSub: "sub-1",
      email: "seller@test.pk",
      displayName: "Seller Name",
      photoUrl: "",
      authProvider: "google.com",
      role: "seller",
      plan: null,
      dashboardEnabled: false,
      lastSignedInAt: 1700000000000,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    });
    vi.mocked(api.getMyApplication).mockResolvedValue(null);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Continue with Google")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Continue with Google"));

    await waitFor(() => {
      expect(api.signInWithGoogleCredential).toHaveBeenCalled();
    });
  });

  it("renders approval screen for pending application", async () => {
    vi.mocked(api.getSession).mockResolvedValue({
      id: "u-1",
      googleSub: "sub-1",
      email: "seller@test.pk",
      displayName: "Seller Name",
      photoUrl: "",
      authProvider: "google.com",
      role: "seller",
      plan: null,
      dashboardEnabled: false,
      lastSignedInAt: 1700000000000,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    });
    vi.mocked(api.getMyApplication).mockResolvedValue({
      id: "app-1",
      userId: "u-1",
      status: "PENDING_REVIEW",
      version: 1,
      sellerType: "individual",
      storeName: "Test Store",
      storeSlug: "test-store",
      category: "Food",
      description: "Organic food delivery",
      warehouseAddress: "123 Street",
      pickupCity: "Lahore",
      pickupArea: "Gulberg",
      pickupContactPerson: "Ahmad",
      pickupContactMobile: "+923000000000",
      cnicNumber: "3520100000001",
      bannerUploadId: null,
      logoUploadId: "doc-1",
      cnicFrontUploadId: "doc-2",
      cnicBackUploadId: "doc-3",
      companyDocumentUploadId: null,
      submittedAt: 1700000000000,
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: "",
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    });

    window.history.replaceState(null, "", "/onboarding/approval");
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Verification Under Review")).toBeDefined();
      expect(screen.getByText("Application Status: PENDING REVIEW")).toBeDefined();
    });
  });
});
