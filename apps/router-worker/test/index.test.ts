import { describe, expect, it, vi } from "vitest";
import router, { type Env } from "../src/index.js";

describe("Router Worker Gateway", () => {
  const mockApiWorker = {
    fetch: vi.fn(
      async (_req: Request) =>
        new Response(JSON.stringify({ fromApi: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ),
  };

  const env: Env = {
    API_WORKER: mockApiWorker,
    USER_PAGES_ORIGIN: "https://user-pages.internal",
    ADMIN_PAGES_ORIGIN: "https://admin-pages.internal",
  };

  it("routes /v1 and /health requests directly to API_WORKER service binding", async () => {
    const res1 = await router.fetch(new Request("https://foran.pk/v1/auth/session"), env);
    expect(res1.status).toBe(200);
    expect(mockApiWorker.fetch).toHaveBeenCalled();

    const res2 = await router.fetch(new Request("https://foran.pk/health"), env);
    expect(res2.status).toBe(200);
  });

  it("redirects root / to /user/", async () => {
    const res = await router.fetch(new Request("https://foran.pk/"), env);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://foran.pk/user/");
  });

  it("proxies /user and /admin paths with path prefix stripped", async () => {
    const globalFetch = vi.fn(async (_req: Request) => new Response("pages html", { status: 200 }));
    vi.stubGlobal("fetch", globalFetch);

    const userRes = await router.fetch(new Request("https://foran.pk/user/dashboard"), env);
    expect(userRes.status).toBe(200);
    expect(globalFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://user-pages.internal/dashboard",
      }),
    );

    const adminRes = await router.fetch(new Request("https://foran.pk/admin/queue"), env);
    expect(adminRes.status).toBe(200);
    expect(globalFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://admin-pages.internal/queue",
      }),
    );

    vi.unstubAllGlobals();
  });
});
