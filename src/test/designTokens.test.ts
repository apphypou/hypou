import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/index.css"), "utf8");
const themeSource = readFileSync(join(process.cwd(), "src/hooks/useTheme.tsx"), "utf8");

describe("Hypou design tokens", () => {
  it("uses the refined semantic color values", () => {
    expect(css).toContain("--primary: 178 88% 48%");
    expect(css).toContain("--pink: 331 92% 58%");
    expect(css).toContain("--hype: 178 88% 48%");
    expect(css).toContain("--flop: 331 100% 58%");
  });

  it("keeps overlays and default glow restrained", () => {
    expect(css).toContain("--overlay-scrim: 0 0% 0% / 0.28");
    expect(css).toContain("0 0 14px hsl(var(--primary) / 0.22)");
    expect(css).toContain("0 0 22px hsl(var(--primary) / 0.32)");
  });

  it("defaults new beta sessions to dark mode", () => {
    expect(themeSource).toContain('if (stored) return stored;\n      return "dark";');
    expect(themeSource).not.toContain('matchMedia("(prefers-color-scheme: dark)")');
  });
});
