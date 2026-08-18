import { describe, expect, it } from "vitest";
import { isMarketingRoute } from "@/lib/domainRouting";

describe("isMarketingRoute", () => {
  it("keeps the admin panel available on the main domain", () => {
    expect(isMarketingRoute("hypou.app", "/admin")).toBe(false);
    expect(isMarketingRoute("hypou.app", "/admin/testadores-beta")).toBe(false);
  });

  it("keeps the beta pages on the main domain", () => {
    expect(isMarketingRoute("hypou.app", "/teste")).toBe(true);
    expect(isMarketingRoute("hypou.app", "/admin-help")).toBe(true);
  });

  it("keeps the login flow available for the admin panel", () => {
    expect(isMarketingRoute("hypou.app", "/login")).toBe(false);
    expect(isMarketingRoute("hypou.app", "/recuperar-senha")).toBe(false);
  });
});
