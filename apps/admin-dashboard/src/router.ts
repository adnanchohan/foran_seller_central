export type AdminRoute = { name: "signin" } | { name: "admin" } | { name: "not_found" };

export function getBasePrefix(): string {
  const base = (typeof process !== "undefined" && process.env?.VITE_BASE_PATH) || "";
  return base.replace(/\/+$/, "");
}

export function parseRoute(pathname: string, _search = ""): AdminRoute {
  const base = getBasePrefix();
  let path = pathname;
  if (base && path.startsWith(base)) {
    path = path.slice(base.length);
  }
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  path = path.replace(/\/+$/, "") || "/";

  switch (path) {
    case "/signin":
      return { name: "signin" };
    case "/":
    case "/admin":
      return { name: "admin" };
    default:
      return { name: "admin" };
  }
}

export function formatPath(route: AdminRoute, basePrefix = getBasePrefix()): string {
  const base = basePrefix.replace(/\/+$/, "");
  const subpath = route.name === "signin" ? "/signin" : "/admin";
  return `${base}${subpath}` || "/";
}
