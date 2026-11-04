import { describe, expect, it } from "vitest";
import { SELLER_PLANS } from "./index.js";

describe("Contracts exports", () => {
  it("re-exports config and contracts cleanly", () => {
    expect(SELLER_PLANS).toContain("BASIC");
    expect(SELLER_PLANS).toContain("PREMIUM");
  });
});
