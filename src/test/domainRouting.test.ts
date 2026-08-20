import { describe, expect, it } from "vitest";
import { isMarketingRoute } from "@/lib/domainRouting";

describe("isMarketingRoute", () => {
  it("keeps the admin panel available on web domains", () => {
    expect(isMarketingRoute("hypou.app", "/admin")).toBe(false);
    expect(isMarketingRoute("hypou.app", "/admin/testadores-beta")).toBe(false);
    expect(isMarketingRoute("app.hypou.app", "/admin/login")).toBe(false);
  });

  it("shows only the marketing site to public web visitors", () => {
    expect(isMarketingRoute("hypou.app", "/teste")).toBe(true);
    expect(isMarketingRoute("hypou.app", "/admin-help")).toBe(true);
    expect(isMarketingRoute("app.hypou.app", "/explorar")).toBe(true);
  });

  it("keeps only dedicated admin routes outside of marketing routes", () => {
    expect(isMarketingRoute("hypou.app", "/admin/login")).toBe(false);
    expect(isMarketingRoute("hypou.app", "/login")).toBe(true);
  });
});
