import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Busca render stability", () => {
  it("reuses a stable empty query result instead of allocating a new array per render", () => {
    const source = readFileSync(join(process.cwd(), "src/pages/Busca.tsx"), "utf8");

    expect(source).toContain("const EMPTY_RESULTS: any[] = [];");
    expect(source).toContain("data: results = EMPTY_RESULTS");
    expect(source).not.toContain("data: results = []");
  });
});
