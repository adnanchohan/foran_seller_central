import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("API Worker - Auth & Onboarding Flow", () => {
  const mockNow = 1700000000000;
  const deps = {
    now: () => mockNow,
    verifyGoogleIdentity: async (token: string) => {
      if (token === "admin-token") {
        return {
          sub: "test-admin-subject",
          email: "admin@example.test",
          name: "Admin User",
        };
      }
      return {
        sub: "seller-123",
        email: "seller@example.test",
        name: "Seller One",
      };
    },
  };

  it("checks health probes", async () => {
    const app = createApp(deps);
    const healthRes = await app.request("https://example.com/health", {}, env);
    expect(healthRes.status).toBe(200);
    const healthData = (await healthRes.json()) as { status: string };
    expect(healthData.status).toBe("ok");

    const v1HealthRes = await app.request("https://example.com/v1/health", {}, env);
    expect(v1HealthRes.status).toBe(200);
  });

  it("authenticates via google-session and retrieves session", async () => {
    const app = createApp(deps);

    const res = await app.request(
      "https://example.com/v1/auth/google-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "dummy-seller-token" }),
      },
      env,
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      user: { id: string; email: string; role: string };
      sessionToken: string;
      csrfToken: string;
    };
    expect(data.user.email).toBe("seller@example.test");
    expect(data.user.role).toBe("seller");
    expect(data.sessionToken).toBeDefined();
    expect(data.csrfToken).toBeDefined();

    // Verify session retrieval using sessionToken
    const sessionRes = await app.request(
      "https://example.com/v1/auth/session",
      {
        headers: { Authorization: `Bearer ${data.sessionToken}` },
      },
      env,
    );
    expect(sessionRes.status).toBe(200);
    const sessionData = (await sessionRes.json()) as { user: { id: string } };
    expect(sessionData.user.id).toBe(data.user.id);
  });

  it("saves application draft and handles submission validation", async () => {
    const app = createApp(deps);

    // 1. Sign in seller
    const authRes = await app.request(
      "https://example.com/v1/auth/google-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "seller-token" }),
      },
      env,
    );
    const { sessionToken } = (await authRes.json()) as { sessionToken: string };

    // 2. Save draft
    const draftRes = await app.request(
      "https://example.com/v1/onboarding/me/application/draft",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          storeName: "Super Fresh Grocers",
          category: "Grocery",
          description: "Fresh vegetables and organic food delivery across Lahore city.",
          warehouseAddress: "Plot 45, Industrial Area, Sector 3",
          pickupCity: "Lahore",
          pickupArea: "Gulberg",
          pickupContactPerson: "Ahmad Ali",
          pickupContactMobile: "+923001234567",
          cnicNumber: "35201-1234567-1",
        }),
      },
      env,
    );
    expect(draftRes.status).toBe(200);
    const draftData = (await draftRes.json()) as {
      application: { id: string; storeName: string; status: string; storeSlug: string };
    };
    expect(draftData.application.storeName).toBe("Super Fresh Grocers");
    expect(draftData.application.status).toBe("DRAFT");
    expect(draftData.application.storeSlug).toBeDefined();

    // 3. Attempting to submit without documents should fail with 400
    const failSubmitRes = await app.request(
      "https://example.com/v1/onboarding/me/application/submit",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      },
      env,
    );
    expect(failSubmitRes.status).toBe(400);

    // 4. Upload mock documents
    const uploadDoc = async (type: string, name: string) => {
      const form = new FormData();
      form.append("file", new File(["dummy file content"], name, { type: "image/png" }));
      form.append("documentType", type);
      const res = await app.request(
        "https://example.com/v1/uploads",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${sessionToken}` },
          body: form,
        },
        env,
      );
      expect(res.status).toBe(201);
      const resJson = (await res.json()) as { document: { id: string } };
      return resJson.document.id;
    };

    const logoId = await uploadDoc("store-logo", "logo.png");
    const cnicFrontId = await uploadDoc("cnic-front", "cnic-front.png");
    const cnicBackId = await uploadDoc("cnic-back", "cnic-back.png");

    // 5. Update draft with uploaded doc IDs
    const updateDraftRes = await app.request(
      "https://example.com/v1/onboarding/me/application/draft",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          logoUploadId: logoId,
          cnicFrontUploadId: cnicFrontId,
          cnicBackUploadId: cnicBackId,
        }),
      },
      env,
    );
    expect(updateDraftRes.status).toBe(200);

    // 6. Submit application
    const submitRes = await app.request(
      "https://example.com/v1/onboarding/me/application/submit",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      },
      env,
    );
    expect(submitRes.status).toBe(200);
    const submitData = (await submitRes.json()) as {
      application: { status: string; version: number };
    };
    expect(submitData.application.status).toBe("PENDING_REVIEW");
    expect(submitData.application.version).toBe(1);
  });

  it("isolates seller and admin portals and prevents unauthorized admin sign-in", async () => {
    const app = createApp(deps);

    // 1. Non-admin attempting to sign in to admin portal is forbidden
    const nonAdminLoginRes = await app.request(
      "https://example.com/v1/auth/google-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "dummy-seller-token", portal: "admin" }),
      },
      env,
    );
    expect(nonAdminLoginRes.status).toBe(403);

    // 2. Admin signs in to admin portal and receives foran_admin_session cookie
    const adminLoginRes = await app.request(
      "https://example.com/v1/auth/google-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "admin-token", portal: "admin" }),
      },
      env,
    );
    expect(adminLoginRes.status).toBe(200);
    const setCookieHeader = adminLoginRes.headers.get("set-cookie") || "";
    expect(setCookieHeader).toContain("foran_admin_session=");

    // 3. Sign out clears the cookies
    const signOutRes = await app.request(
      "https://example.com/v1/auth/signout?portal=admin",
      { method: "POST" },
      env,
    );
    expect(signOutRes.status).toBe(200);
    const signOutSetCookie = signOutRes.headers.get("set-cookie") || "";
    expect(signOutSetCookie).toContain("foran_admin_session=");
  });
});
