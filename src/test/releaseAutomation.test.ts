import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("release automation", () => {
  it("exposes a small release interface", () => {
    const pkg = JSON.parse(readSource("package.json"));

    expect(pkg.scripts.release).toBe("node scripts/release.mjs");
    expect(pkg.scripts["release:status"]).toBe("node scripts/release.mjs status");
    expect(pkg.scripts["release:web"]).toBe("node scripts/release.mjs web");
    expect(pkg.scripts["release:ios"]).toBe("node scripts/release.mjs ios");
    expect(pkg.scripts["release:android"]).toBe("node scripts/release.mjs android");
  });

  it("reports release status without changing files", () => {
    const output = execFileSync(process.execPath, ["scripts/release.mjs", "status"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(output).toContain("Hypou release status");
    expect(output).toContain("iOS:");
    expect(output).toContain("Android:");
  });

  it("keeps cloud uploads behind explicit confirmations", () => {
    const script = readSource("scripts/release.mjs");

    expect(script).toContain("--confirm-testflight");
    expect(script).toContain("APP_STORE_CONNECT_API_KEY_ID");
    expect(script).toContain("Android publishing is blocked");
  });

  it("runs the release gate on every pull request", () => {
    const workflow = readSource(".github/workflows/verify.yml");

    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("node-version: 22");
    expect(workflow).toContain("npm run typecheck");
    expect(workflow).toContain("npm run build:web");
    expect(workflow).toContain("npm run build:mobile");
  });
});
