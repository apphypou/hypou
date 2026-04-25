import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import SwipeToggle from "@/components/SwipeToggle";

describe("SwipeToggle", () => {
  it("01 renderiza svg do toggle", () => {
    const { container } = render(<SwipeToggle onSwipe={() => {}} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("02 cursor grab quando habilitado", () => {
    const { container } = render(<SwipeToggle onSwipe={() => {}} />);
    expect((container.firstChild as HTMLElement).style.cursor).toBe("grab");
  });

  it("03 cursor default quando disabled", () => {
    const { container } = render(<SwipeToggle onSwipe={() => {}} disabled />);
    expect((container.firstChild as HTMLElement).style.cursor).toBe("default");
  });

  it("04 touchAction none para gestos custom", () => {
    const { container } = render(<SwipeToggle onSwipe={() => {}} />);
    expect((container.firstChild as HTMLElement).style.touchAction).toBe("none");
  });

  it("05 disabled não dispara pointerDown", () => {
    const fn = vi.fn();
    const { container } = render(<SwipeToggle onSwipe={fn} disabled />);
    const el = container.firstChild as HTMLElement;
    el.dispatchEvent(new PointerEvent("pointerdown", { clientX: 50 }));
    expect(fn).not.toHaveBeenCalled();
  });
});
