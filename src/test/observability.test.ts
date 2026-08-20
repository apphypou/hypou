import { describe, expect, it } from "vitest";
import { createTraceId, sanitizeObservabilityData } from "@/lib/observability";

describe("observability", () => {
  it("creates trace ids that carry the operation scope", () => {
    expect(createTraceId("price")).toMatch(/^price-[A-Za-z0-9-]{8,}$/);
  });

  it("removes sensitive fields before telemetry is persisted", () => {
    expect(sanitizeObservabilityData({
      providerStatus: 429,
      token: "secret",
      userEmail: "person@example.com",
      description: "private text",
    })).toEqual({ providerStatus: 429 });
  });

  it("redacts URLs and emails from allowed diagnostic strings", () => {
    expect(sanitizeObservabilityData({ detail: "Falha em https://example.com para person@example.com" }))
      .toEqual({ detail: "Falha em [url] para [email]" });
  });
});
