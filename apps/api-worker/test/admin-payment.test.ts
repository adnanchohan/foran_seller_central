import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("API Worker - Admin Review, Plan Selection & Dashboard Flow", () => {
  const mockNow = 1700000000000;
  const deps = {
    now: () => mockNow,
    verifyGoogleIdentity: async (token: string) => {
      if (token === "admin-credential") {
        return {
          sub: "test-admin-subject",
          email: "admin@example.test",
          name: "System Admin",
        };
      }
      return {
        sub: "seller-user-456",
        email: "seller2@example.test",
        name: "Second Seller",
      };
    },
  };

  it("completes full seller journey from review to payment and dashboard access", async () => {
    const app = createApp(deps);

    // 1. Authenticate Seller
    const sellerAuth = await app.request(
      "https://example.com/v1/auth/google-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "seller-credential" }),
      },
      env,
    );
    const { sessionToken: sellerToken } = (await sellerAuth.json()) as { sessionToken: string };

    // 2. Upload Seller Documents
    const uploadDoc = async (type: string, name: string) => {
      const form = new FormData();
      form.append("file", new File(["document bytes"], name, { type: "image/jpeg" }));
      form.append("documentType", type);
      const res = await app.request(
        "https://example.com/v1/uploads",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${sellerToken}` },
          body: form,
        },
        env,
      );
      expect(res.status).toBe(201);
      const resJson = (await res.json()) as { document: { id: string } };
      return resJson.document.id;
    };

    const logoId = await uploadDoc("store-logo", "logo.jpg");
    const cnicFrontId = await uploadDoc("cnic-front", "cnic-front.jpg");
    const cnicBackId = await uploadDoc("cnic-back", "cnic-back.jpg");

    // 3. Save draft & submit
    await app.request(
      "https://example.com/v1/onboarding/me/application/draft",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({
          storeName: "Karachi Spice Bazaar",
          category: "Spices",
          description: "High quality whole spices and herbs directly from suppliers.",
          warehouseAddress: "Plot 12, Korangi Industrial Area",
          pickupCity: "Karachi",
          pickupArea: "Korangi",
          pickupContactPerson: "Zahid Khan",
          pickupContactMobile: "+923211234567",
          cnicNumber: "42101-9876543-1",
          logoUploadId: logoId,
          cnicFrontUploadId: cnicFrontId,
          cnicBackUploadId: cnicBackId,
        }),
      },
      env,
    );

    const submitRes = await app.request(
      "https://example.com/v1/onboarding/me/application/submit",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
      env,
    );
    expect(submitRes.status).toBe(200);
    const { application } = (await submitRes.json()) as { application: { id: string } };

    // 4. Authenticate Admin
    const adminAuth = await app.request(
      "https://example.com/v1/auth/google-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "admin-credential", portal: "admin" }),
      },
      env,
    );
    expect(adminAuth.status).toBe(200);
    const adminData = (await adminAuth.json()) as {
      user: { role: string };
      sessionToken: string;
    };
    expect(adminData.user.role).toBe("admin");
    const adminToken = adminData.sessionToken;

    // 5. Admin lists pending applications
    const listRes = await app.request(
      "https://example.com/v1/admin/applications?status=PENDING_REVIEW",
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      env,
    );
    expect(listRes.status).toBe(200);
    const { applications } = (await listRes.json()) as { applications: Array<{ id: string }> };
    expect(applications.some((a) => a.id === application.id)).toBe(true);

    // 6. Admin approves application
    const approveRes = await app.request(
      `https://example.com/v1/admin/applications/${application.id}/decision`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          decision: "APPROVE",
          note: "All verified and in order.",
        }),
      },
      env,
    );
    expect(approveRes.status).toBe(200);
    const approvedData = (await approveRes.json()) as { application: { status: string } };
    expect(approvedData.application.status).toBe("APPROVED");

    // 7. Seller selects PREMIUM plan
    const planRes = await app.request(
      "https://example.com/v1/onboarding/me/plan",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({ plan: "PREMIUM" }),
      },
      env,
    );
    expect(planRes.status).toBe(200);
    const planData = (await planRes.json()) as { user: { plan: string } };
    expect(planData.user.plan).toBe("PREMIUM");

    // 8. Attempting to open dashboard before payment should fail with 403
    const prePayDashboardRes = await app.request(
      "https://example.com/v1/dashboard",
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
      env,
    );
    expect(prePayDashboardRes.status).toBe(403);

    // 9. Seller completes placeholder payment
    const paymentRes = await app.request(
      "https://example.com/v1/payments/placeholder",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
      env,
    );
    expect(paymentRes.status).toBe(201);
    const paymentData = (await paymentRes.json()) as {
      payment: { amount: number; plan: string; status: string };
    };
    expect(paymentData.payment.amount).toBe(15999);
    expect(paymentData.payment.status).toBe("DEMO_COMPLETED");

    // 10. Dashboard is now accessible
    const postPayDashboardRes = await app.request(
      "https://example.com/v1/dashboard",
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
      env,
    );
    expect(postPayDashboardRes.status).toBe(200);
    const dashboardData = (await postPayDashboardRes.json()) as {
      user: { dashboardEnabled: boolean };
      application: { storeName: string };
      payment: { amount: number };
    };
    expect(dashboardData.user.dashboardEnabled).toBe(true);
    expect(dashboardData.application.storeName).toBe("Karachi Spice Bazaar");
    expect(dashboardData.payment.amount).toBe(15999);

    // 11. Admin downloads document
    const downloadRes = await app.request(
      `https://example.com/v1/admin/documents/${logoId}/download`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      env,
    );
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers.get("Content-Type")).toBe("image/jpeg");
  });
});
