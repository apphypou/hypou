import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("mobile visual layout", () => {
  it("keeps all four proposal tabs visible on an iPhone viewport", () => {
    const source = readSource("src/pages/Matches.tsx");

    expect(source).toContain("grid grid-cols-4");
    expect(source).not.toContain('className="flex gap-2 px-6 pb-3 shrink-0 overflow-x-auto no-scrollbar"');
  });

  it("keeps the empty profile card compact above the bottom navigation", () => {
    const source = readSource("src/pages/MeuPerfil.tsx");

    expect(source).toContain('GlassCard className="mb-24 p-5 flex flex-col items-center gap-2.5 text-center"');
    expect(source).toContain('className="h-14 w-14 rounded-2xl bg-primary/10');
  });

  it("keeps compact Explore content inside its clipping gradient", () => {
    const source = readSource("src/components/SwipeCard.tsx");

    expect(source).toContain('height: "42%"');
    expect(source).toContain('minHeight: "240px"');
  });

  it("lets the Explore card fill the top and both sides without a page title", () => {
    const source = readSource("src/pages/Explorar.tsx");

    expect(source).not.toContain(">\n          Explorar\n        </h1>");
    expect(source).toContain('className="relative flex-1 flex flex-col items-center justify-start w-full pb-28 pt-0 z-10"');
    expect(source).not.toContain('justify-start w-full px-4 pb-28');
    expect(source).not.toContain("NotificationBell");
  });

  it("keeps the Explore swipe card square at the top edge", () => {
    const source = readSource("src/components/SwipeCard.tsx");

    expect(source).toContain('borderRadius: "0 0 1.5rem 1.5rem"');
    expect(source).toContain("rounded-t-none rounded-b-[1.65rem]");
    expect(source).toContain("rounded-t-none rounded-b-[1.5rem]");
  });

  it("uses a Tinder-like downward exit motion for Explore swipes", () => {
    const source = readSource("src/components/SwipeCard.tsx");

    expect(source).toContain("const EXIT_Y = 260;");
    expect(source).toContain("animate(y, EXIT_Y");
    expect(source).toContain("animate(y, 0");
    expect(source).toContain("y: standby ? 0 : y");
    expect(source).toContain("const standbyOpacity = useTransform(revealProgress, [0, 1], [0, 1]);");
    expect(source).toContain("const standbyScale = useTransform(revealProgress, [0, 1], [0.97, 1]);");
    expect(source).toContain("standby ? { opacity: standbyOpacity } : {}");
  });

  it("reveals the next Explore card only while the active card is moving", () => {
    const source = readSource("src/pages/Explorar.tsx");

    expect(source).toContain("const dragDirectionValue = useMotionValue(0);");
    expect(source).toContain("dragDirectionValue.set(rawX);");
    expect(source).toContain("revealMotionX={dragDirectionValue}");
  });
});
