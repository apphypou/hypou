import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  SkeletonItemCard,
  SkeletonMatchCard,
  SkeletonConversation,
  SkeletonSwipeCard,
  SkeletonProfile,
} from "@/components/SkeletonCard";

describe("Skeleton variants", () => {
  it("01 SkeletonItemCard tem animate-pulse", () => {
    const { container } = render(<SkeletonItemCard />);
    expect((container.firstChild as HTMLElement).className).toMatch(/animate-pulse/);
  });

  it("02 SkeletonMatchCard renderiza", () => {
    const { container } = render(<SkeletonMatchCard />);
    expect(container.firstChild).toBeTruthy();
  });

  it("03 SkeletonConversation tem avatar circular", () => {
    const { container } = render(<SkeletonConversation />);
    expect(container.querySelector(".rounded-full")).toBeTruthy();
  });

  it("04 SkeletonSwipeCard tem aspect cheio", () => {
    const { container } = render(<SkeletonSwipeCard />);
    expect((container.firstChild as HTMLElement).className).toMatch(/h-full/);
  });

  it("05 SkeletonProfile centralizado", () => {
    const { container } = render(<SkeletonProfile />);
    expect((container.firstChild as HTMLElement).className).toMatch(/items-center/);
  });
});
