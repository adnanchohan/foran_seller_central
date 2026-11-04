export type UserRoute =
  | { name: "signin" }
  | { name: "journey" }
  | { name: "store" }
  | { name: "approval" }
  | { name: "plans" }
  | { name: "payment" }
  | { name: "dashboard" }
  | { name: "not_found" };

export function getBasePrefix(): string {
  const base = (typeof process !== "undefined" && process.env?.VITE_BASE_PATH) || "";
  return base.replace(/\/+$/, "");
}

export function parseRoute(pathname: string, _search = ""): UserRoute {
  const base = getBasePrefix();
  let path = pathname;
  if (base && path.startsWith(base)) {
    path = path.slice(base.length);
  }
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  // Remove trailing slashes
  path = path.replace(/\/+$/, "") || "/";

  switch (path) {
    case "/signin":
      return { name: "signin" };
    case "/":
      return { name: "journey" };
    case "/onboarding/store":
      return { name: "store" };
    case "/onboarding/approval":
      return { name: "approval" };
    case "/onboarding/plans":
      return { name: "plans" };
    case "/onboarding/payment":
      return { name: "payment" };
    case "/dashboard":
      return { name: "dashboard" };
    default:
      return { name: "not_found" };
  }
}

export function formatPath(route: UserRoute, basePrefix = getBasePrefix()): string {
  const base = basePrefix.replace(/\/+$/, "");
  let subpath: string;
  switch (route.name) {
    case "signin":
      subpath = "/signin";
      break;
    case "journey":
      subpath = "/";
      break;
    case "store":
      subpath = "/onboarding/store";
      break;
    case "approval":
      subpath = "/onboarding/approval";
      break;
    case "plans":
      subpath = "/onboarding/plans";
      break;
    case "payment":
      subpath = "/onboarding/payment";
      break;
    case "dashboard":
      subpath = "/dashboard";
      break;
    default:
      subpath = "/";
      break;
  }
  return `${base}${subpath}` || "/";
}
