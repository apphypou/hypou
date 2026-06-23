import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("iOS dev signing", () => {
  it("keeps simulator dev builds signed so Google Sign-In can use Keychain", () => {
    const script = readSource("scripts/ios-dev.mjs");

    expect(script).not.toContain("CODE_SIGNING_ALLOWED=NO");
  });

  it("declares the app keychain access group for native social login", () => {
    const entitlements = readSource("ios/App/App/App.entitlements");

    expect(entitlements).toContain("keychain-access-groups");
    expect(entitlements).toContain("$(AppIdentifierPrefix)app.hypou.mobile");
  });
});
