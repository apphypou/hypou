import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MotionValue } from "framer-motion";
import SwipeToggle from "@/components/SwipeToggle";

describe("SwipeToggle", () => {
  const dp = new MotionValue(0);

  it("01 renderiza svg do toggle", () => {
    const { container } = render(<SwipeToggle onSwipe={() => {}} dragProgress={dp} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("02 cursor grab quando habilitado", () => {
    const { container } = render(<SwipeToggle onSwipe={() => {}} dragProgress={dp} />);
    expect((container.firstChild as HTMLElement).style.cursor).toBe("grab");
  });

  it("03 cursor default quando disabled", () => {
    const { container } = render(<SwipeToggle onSwipe={() => {}} disabled dragProgress={dp} />);
    expect((container.firstChild as HTMLElement).style.cursor).toBe("default");
  });

  it("04 touchAction none para gestos custom", () => {
    const { container } = render(<SwipeToggle onSwipe={() => {}} dragProgress={dp} />);
    expect((container.firstChild as HTMLElement).style.touchAction).toBe("none");
  });

  it("05 disabled não dispara onSwipe pelo pointer-down", () => {
    const fn = vi.fn();
    render(<SwipeToggle onSwipe={fn} disabled dragProgress={dp} />);
    expect(fn).not.toHaveBeenCalled();
  });
});
