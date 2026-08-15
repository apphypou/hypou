import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("proposal item UI", () => {
  it("opens complete details for either item in a proposal", () => {
    const source = readSource("src/pages/Matches.tsx");

    expect(source).toContain('import ItemPreviewDialog from "@/components/ItemPreviewDialog"');
    expect(source).toContain("const [previewItemId, setPreviewItemId]");
    expect(source).toContain("setPreviewItemId(itemId)");
    expect(source).toContain("<ItemPreviewDialog");
  });
});
