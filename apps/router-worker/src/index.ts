export interface Env {
  API_WORKER: { fetch(request: Request): Promise<Response> };
  USER_PAGES_ORIGIN: string;
  ADMIN_PAGES_ORIGIN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. API routes & System endpoints -> Direct Service Binding (0ms latency)
    if (
      path.startsWith("/v1/") ||
      path === "/v1" ||
      path.startsWith("/api/v1/") ||
      path === "/api/v1" ||
      path === "/health" ||
      path === "/ready"
    ) {
      return env.API_WORKER.fetch(request);
    }

    // 2. User Dashboard -> Proxy to Cloudflare Pages project
    if (path.startsWith("/user")) {
      return proxyToPages(request, url, "/user", env.USER_PAGES_ORIGIN);
    }

    // 3. Admin Dashboard -> Proxy to Cloudflare Pages project
    if (path.startsWith("/admin")) {
      return proxyToPages(request, url, "/admin", env.ADMIN_PAGES_ORIGIN);
    }

    // 4. Default root fallback
    return Response.redirect(`${url.origin}/user/`, 302);
  },
};

async function proxyToPages(
  request: Request,
  url: URL,
  prefix: string,
  pagesOrigin: string,
): Promise<Response> {
  const strippedPath = url.pathname.slice(prefix.length) || "/";
  const pagesUrl = `${pagesOrigin}${strippedPath}${url.search}`;
  const proxyRequest = new Request(pagesUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: "manual",
  });
  return fetch(proxyRequest);
}
