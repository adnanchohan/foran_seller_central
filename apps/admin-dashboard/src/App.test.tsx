import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.js";
import * as api from "./api.js";

vi.mock("./api.js", () => ({
  getSession: vi.fn(),
  signInWithGoogleCredential: vi.fn(),
  signOut: vi.fn(),
  listApplications: vi.fn(),
  getApplication: vi.fn(),
  reviewApplication: vi.fn(),
  downloadDocument: vi.fn(),
  deleteApplication: vi.fn(),
  getDocumentViewUrl: vi.fn((id: string) => `/mock-docs/${id}`),
}));

describe("Admin Dashboard App Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/admin");
    sessionStorage.clear();
  });

  it("renders admin sign in when unauthenticated", async () => {
    vi.mocked(api.getSession).mockResolvedValue(null);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Admin Portal Login")).toBeDefined();
      expect(screen.getByText("Admin Google Single Sign-On")).toBeDefined();
    });
  });

  it("renders applications queue when authenticated as admin", async () => {
    vi.mocked(api.getSession).mockResolvedValue({
      id: "admin-1",
      googleSub: "admin-sub-1",
      email: "admin@foran.pk",
      displayName: "Head of Operations",
      photoUrl: "",
      authProvider: "google.com",
      role: "admin",
      plan: null,
      dashboardEnabled: true,
      lastSignedInAt: 1700000000000,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    });
    vi.mocked(api.listApplications).mockResolvedValue([
      {
        id: "app-100",
        userId: "user-100",
        status: "PENDING_REVIEW",
        version: 1,
        sellerType: "company",
        storeName: "Alpha Logistics",
        storeSlug: "alpha-logistics",
        category: "Services",
        description: "Leading delivery solutions provider.",
        warehouseAddress: "Port Qasim, Karachi",
        pickupCity: "Karachi",
        pickupArea: "Port Qasim",
        pickupContactPerson: "Bilal",
        pickupContactMobile: "+923009999999",
        cnicNumber: "4210100000002",
        bannerUploadId: null,
        logoUploadId: "logo-1",
        cnicFrontUploadId: "cnic-1",
        cnicBackUploadId: "cnic-2",
        companyDocumentUploadId: null,
        submittedAt: 1700000000000,
        reviewedAt: null,
        reviewedBy: null,
        reviewNote: "",
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Seller Application Reviews")).toBeDefined();
      expect(screen.getByText("Alpha Logistics")).toBeDefined();
    });

    // Click application to inspect
    fireEvent.click(screen.getByText("Alpha Logistics"));

    await waitFor(() => {
      expect(screen.getByText("Reviewer Feedback Note")).toBeDefined();
      expect(screen.getByText("Approve Store")).toBeDefined();
    });
  });
});
