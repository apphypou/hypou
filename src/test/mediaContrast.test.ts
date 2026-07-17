import { describe, expect, it, vi } from "vitest";
import {
  classifyLuminance,
  classifyRgbaSamples,
  measureImageTone,
} from "@/lib/mediaContrast";

describe("mediaContrast", () => {
  it("classifies bright media that needs stronger dark glass", () => {
    expect(classifyLuminance(222)).toBe("bright");
  });

  it("classifies dark media without over-darkening", () => {
    expect(classifyLuminance(54)).toBe("dark");
  });

  it("keeps mid-tone media neutral", () => {
    expect(classifyLuminance(132)).toBe("neutral");
  });

  it("classifies sampled RGBA pixels by perceived luminance", () => {
    const whitePixels = new Uint8ClampedArray([
      255, 255, 255, 255,
      244, 244, 244, 255,
      232, 232, 232, 255,
      240, 240, 240, 255,
    ]);

    expect(classifyRgbaSamples(whitePixels)).toBe("bright");
  });

  it("falls back to neutral if canvas sampling is unavailable", () => {
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") return {} as HTMLCanvasElement;
      return originalCreateElement(tagName);
    });

    const image = new Image();
    expect(measureImageTone(image)).toBe("neutral");
  });
});
