import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("social link preview", () => {
  it("uses an opaque image with the dimensions declared in Open Graph", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    const imagePath = html.match(/property="og:image" content="https:\/\/hypou\.app\/(.*?)"/)?.[1];
    const width = Number(html.match(/property="og:image:width" content="(\d+)"/)?.[1]);
    const height = Number(html.match(/property="og:image:height" content="(\d+)"/)?.[1]);

    expect(imagePath).toBe("social-preview-v2.png");

    const png = readFileSync(resolve(process.cwd(), "public", imagePath!));
    expect(png.readUInt32BE(16)).toBe(width);
    expect(png.readUInt32BE(20)).toBe(height);
    expect(png[25]).toBe(2);
  });
});
