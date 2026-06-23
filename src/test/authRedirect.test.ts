import { describe, expect, it } from "vitest";
import { getNativeAuthPathFromUrl } from "@/lib/authRedirect";

describe("native auth redirect parsing", () => {
  it("extracts the native callback path", () => {
    expect(getNativeAuthPathFromUrl("hypou://auth-callback/explorar")).toBe("/explorar");
  });

  it("keeps route query params but strips OAuth token hash", () => {
    expect(
      getNativeAuthPathFromUrl(
        "hypou://auth-callback/partidas?tab=ativas#access_token=secret&refresh_token=secret",
      ),
    ).toBe("/partidas?tab=ativas");
  });

  it("ignores non-Hypou callback URLs", () => {
    expect(getNativeAuthPathFromUrl("https://example.com/explorar")).toBeNull();
  });
});
