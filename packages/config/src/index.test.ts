import { describe, expect, it } from "vitest";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  APPLICATION_STATUSES,
  DOCUMENT_TYPES,
  PLAN_PRICING,
  SELLER_PLANS,
  SELLER_TYPES,
  USER_ROLES,
} from "./index.js";

describe("Shared Platform Config", () => {
  it("defines expected domain constants", () => {
    expect(SELLER_PLANS).toEqual(["BASIC", "PREMIUM"]);
    expect(APPLICATION_STATUSES).toContain("PENDING_REVIEW");
    expect(SELLER_TYPES).toEqual(["individual", "company"]);
    expect(DOCUMENT_TYPES.length).toBe(5);
    expect(ALLOWED_DOCUMENT_MIME_TYPES).toContain("image/png");
    expect(USER_ROLES).toEqual(["seller", "admin"]);
    expect(PLAN_PRICING.BASIC.amount).toBe(5000);
    expect(PLAN_PRICING.PREMIUM.amount).toBe(15999);
  });
});
