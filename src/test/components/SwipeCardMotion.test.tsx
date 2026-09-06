import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { motionValue, type HTMLMotionProps, type PanInfo } from "framer-motion";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SwipeCard from "@/components/SwipeCard";
import { renderWithProviders } from "../helpers/renderWithProviders";

const captured = vi.hoisted(() => ({ card: null as HTMLMotionProps<"div"> | null, backdrop: null as HTMLMotionProps<"div"> | null, animate: vi.fn() }));
const media = vi.hoisted(() => ({ preload: vi.fn<() => Promise<void>>() }));
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  const { forwardRef } = await import("react");
  return {
    ...actual,
    animate: captured.animate,
    motion: { span: actual.motion.span, button: actual.motion.button, div: forwardRef<HTMLDivElement, HTMLMotionProps<"div">>((props, ref) => {
      if (props.className?.includes("swipe-card-shell")) captured.card = props;
      if (props.className?.includes("swipe-card-backdrop")) captured.backdrop = props;
      return <div ref={ref} className={props.className}>{props.children as ReactNode}</div>;
    }) },
  };
});
vi.mock("@/hooks/useRatings", () => ({ useUserRating: () => ({ data: null }) }));
vi.mock("@/lib/haptics", () => ({ haptic: vi.fn() }));
vi.mock("@/lib/mediaPreload", () => ({ preloadImage: media.preload, preloadVideo: media.preload }));
vi.mock("@/components/SwipeCard/SwipeOverlays", () => ({ SwipeOverlays: () => null }));

const item = { id: "one", name: "Câmera", category: "Eletrônicos", item_images: [], item_videos: [] };
const release = (offset: number, velocity: number) => {
  act(() => {
    (captured.card!.style!.x as ReturnType<typeof motionValue<number>>).set(offset);
    captured.card!.onDragEnd!({} as PointerEvent, { offset: { x: offset, y: 0 }, velocity: { x: velocity, y: 0 } } as PanInfo);
  });
};

describe("SwipeCard motion", () => {
  beforeEach(() => {
    captured.animate.mockReset();
    media.preload.mockReset().mockResolvedValue(undefined);
  });

  it("tracks x directly, without drag resistance, and returns short gestures", () => {
    renderWithProviders(<SwipeCard item={item} onSwipeComplete={vi.fn()} />);
    expect(captured.card!.drag).toBe("x");
    expect(captured.card!.dragConstraints).toBeUndefined();
    expect(captured.card!.dragDirectionLock).toBeUndefined();
    release(32, 70);
    const [x, target, options] = captured.animate.mock.calls[0];
    expect(x.get()).toBe(32);
    expect(target).toBe(0);
    expect(options).toMatchObject({ type: "spring", velocity: 70, damping: 45 });
  });

  it.each([[130, 800, "like"], [-130, -900, "dislike"], [90, -700, "dislike"]])(
    "continues a release from %s px at %s px/s toward %s, completing once",
    (offset, velocity, direction) => {
      const complete = vi.fn();
      renderWithProviders(<SwipeCard item={item} onSwipeComplete={complete} />);
      release(Number(offset), Number(velocity));
      const [x, target, options] = captured.animate.mock.calls[0];
      expect(x.get()).toBe(offset);
      expect(Math.sign(target)).toBe(direction === "like" ? 1 : -1);
      expect(Math.abs(target)).toBeGreaterThan(window.innerWidth);
      expect(options.type).toBe("tween");
      expect(options.duration).toBeLessThanOrEqual(0.32);
      const initialSpeed = options.ease[1] / options.ease[0] * Math.abs(target - Number(offset)) / options.duration;
      expect(initialSpeed).toBeCloseTo(Math.max(0, Number(velocity) * Math.sign(target)));
      expect(captured.card!.transformTemplate!({ x: offset }, `translateX(${offset}px)`)).toBe(`translate(${offset}px, ${Math.abs(Number(offset))}px)`);
      expect(captured.card!.transformTemplate!({ x: target }, `translateX(${target}px)`)).toBe(`translate(${target}px, ${Math.abs(target)}px)`);
      expect(complete).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Hypou" }));
      expect(captured.animate).toHaveBeenCalledOnce();
      options.onComplete();
      expect(complete).toHaveBeenCalledExactlyOnceWith(direction);
    },
  );

  it.each([["Hypou", 1], ["Flopou", -1]] as const)("sends %s to its own corner from rest", (button, sign) => {
    renderWithProviders(<SwipeCard item={item} onSwipeComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: button }));
    const [, target] = captured.animate.mock.calls[0];
    expect(Math.sign(target)).toBe(sign);
    expect(captured.card!.transformTemplate!({ x: target }, `translateX(${target}px)`)).toBe(`translate(${target}px, ${Math.abs(target)}px)`);
  });

  it("promotes the already mounted next image without replacing its DOM node", () => {
    const next = { ...item, id: "two", name: "Bicicleta", item_images: [{ image_url: "/bike.png" }] };
    const progress = motionValue(100);
    const complete = vi.fn();
    const { container, rerender } = renderWithProviders(<>
      <SwipeCard key={next.id} item={next} standby revealMotionX={progress} onSwipeComplete={complete} />
      <SwipeCard key={item.id} item={item} onSwipeComplete={complete} />
    </>);
    const readyImage = container.querySelector("img.swipe-media-foreground");
    rerender(<SwipeCard key={next.id} item={next} onSwipeComplete={complete} />);
    expect(container.querySelector("img.swipe-media-foreground")).toBe(readyImage);
    expect(captured.card!.drag).toBe("x");
  });

  it("crossfades the stationary backdrop during dragging and reverses on cancellation", async () => {
    const progress = motionValue(0);
    renderWithProviders(<SwipeCard item={{ ...item, item_images: [{ image_url: "/camera.png" }] }} standby revealMotionX={progress} onSwipeComplete={vi.fn()} />);
    const opacity = captured.backdrop!.style!.opacity as ReturnType<typeof motionValue<number>>;
    expect(captured.backdrop!.style!.x).toBeUndefined();
    expect(opacity.get()).toBe(0);
    act(() => progress.set(80));
    await waitFor(() => expect(opacity.get()).toBeCloseTo(0.5));
    act(() => progress.set(160));
    await waitFor(() => expect(opacity.get()).toBe(1));
    act(() => progress.set(0));
    await waitFor(() => expect(opacity.get()).toBe(0));
  });

  it("keeps the first product image as the backdrop while gallery photos change", async () => {
    const galleryItem = {
      ...item,
      item_images: [{ image_url: "/first.jpg" }, { image_url: "/second.jpg" }],
    };
    const { container } = renderWithProviders(
      <SwipeCard item={galleryItem} onSwipeComplete={vi.fn()} />,
    );
    const backdrop = container.querySelector<HTMLImageElement>(".swipe-media-ambient")!;
    const foreground = container.querySelector<HTMLImageElement>(".swipe-media-foreground")!;
    expect(backdrop.src).toContain("/first.jpg");
    expect(foreground.src).toContain("/first.jpg");
    expect(container.querySelectorAll(".swipe-media-ambient")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /Fotos do item:/ }));
    await waitFor(() => expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.src).toContain("/second.jpg"));

    expect(container.querySelector(".swipe-media-ambient")).toBe(backdrop);
    expect(backdrop.src).toContain("/first.jpg");
    expect(
      [...container.querySelectorAll<HTMLImageElement>(".swipe-media-ambient")]
        .every((image) => image.src.includes("/first.jpg")),
    ).toBe(true);
    expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.src).toContain("/second.jpg");
    expect(screen.getByRole("button", { name: "Hypou" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Flopou" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Ver detalhes do item" })).toBeVisible();
  });

  it("holds the current photo until decoded and ignores older rapid-tap requests", async () => {
    const { container } = renderWithProviders(<SwipeCard item={{ ...item, item_images: [
      { image_url: "/first.jpg" }, { image_url: "/second.jpg" }, { image_url: "/third.jpg" },
    ] }} onSwipeComplete={vi.fn()} />);
    let secondReady!: () => void;
    let thirdReady!: () => void;
    media.preload.mockImplementationOnce(() => new Promise<void>((resolve) => { secondReady = resolve; }));
    fireEvent.click(screen.getByRole("button", { name: /Fotos do item:/ }));
    expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.src).toContain("/first.jpg");
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    media.preload.mockImplementationOnce(() => new Promise<void>((resolve) => { thirdReady = resolve; }));
    fireEvent.click(screen.getByRole("button", { name: /Fotos do item:/ }));
    await act(async () => thirdReady());
    expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.src).toContain("/third.jpg");
    await act(async () => secondReady());
    expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.src).toContain("/third.jpg");
  });

  it("preserves the photo after failure and retries the requested slide", async () => {
    const { container } = renderWithProviders(<SwipeCard item={{ ...item, market_value: 190000000,
      item_images: [{ image_url: "/first.jpg" }, { image_url: "/second.jpg" }],
    }} onSwipeComplete={vi.fn()} />);
    media.preload.mockRejectedValueOnce(new Error("offline"));
    fireEvent.click(screen.getByRole("button", { name: /Fotos do item:/ }));
    const retry = await screen.findByRole("button", { name: /Tentar novamente/ });
    expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.src).toContain("/first.jpg");
    expect(container.querySelector(".swipe-compact-price")!.textContent).toMatch(/1\.900\.000/);
    fireEvent.click(retry);
    await waitFor(() => expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.src).toContain("/second.jpg"));
    expect(screen.queryByRole("button", { name: /Tentar novamente/ })).toBeNull();
  });

  it("centers gallery photos without moving the first-image backdrop", async () => {
    const { container } = renderWithProviders(<SwipeCard item={{ ...item,
      item_images: [{ image_url: "/first.jpg", focal_x: null, focal_y: null }, { image_url: "/second.jpg", focal_x: 25, focal_y: 70, focal_scale: 1.5 }],
    }} onSwipeComplete={vi.fn()} />);
    expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.style.objectPosition).toBe("50% 50%");
    fireEvent.click(screen.getByRole("button", { name: /Fotos do item:/ }));
    await waitFor(() => expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.src).toContain("/second.jpg"));
    expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.style.objectPosition).toBe("50% 50%");
    expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.style.transform).toContain("scale(1.5)");
    expect([...container.querySelectorAll<HTMLImageElement>(".swipe-media-ambient")].every((image) => image.src.endsWith("/first.jpg"))).toBe(true);
  });

  it("discards a pending gallery request when the product changes", async () => {
    const complete = vi.fn();
    const { container, rerender } = renderWithProviders(<SwipeCard item={{ ...item,
      item_images: [{ image_url: "/first.jpg" }, { image_url: "/second.jpg" }],
    }} onSwipeComplete={complete} />);
    let resolve!: () => void;
    media.preload.mockImplementationOnce(() => new Promise<void>((ready) => { resolve = ready; }));
    fireEvent.click(screen.getByRole("button", { name: /Fotos do item:/ }));
    rerender(<SwipeCard item={{ ...item, id: "replacement", item_images: [{ image_url: "/replacement.jpg" }] }} onSwipeComplete={complete} />);
    await act(async () => resolve());
    expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.src).toContain("/replacement.jpg");
    expect(screen.queryByText("Carregando foto…")).toBeNull();
  });

  it("falls back to the prepared full image if the tiny backdrop fails", () => {
    const { container } = renderWithProviders(<SwipeCard item={{ ...item, item_images: [
      { image_url: "https://example.test/storage/v1/object/public/items/photo.jpg" },
    ] }} onSwipeComplete={vi.fn()} />);
    const background = container.querySelector<HTMLImageElement>(".swipe-media-ambient")!;
    expect(background.src).toContain("width=64");
    fireEvent.error(background);
    expect(background.src).toContain("width=1080");
    const fallback = background.src;
    fireEvent.error(background);
    expect(background.src).toBe(fallback);
  });

  it("uses one accessible gallery control and supports previous/next arrow keys", async () => {
    const { container } = renderWithProviders(<SwipeCard item={{ ...item, item_images: [
      { image_url: "/first.jpg" }, { image_url: "/second.jpg" },
    ] }} onSwipeComplete={vi.fn()} />);
    const gallery = screen.getByRole("button", { name: /Fotos do item: 1 de 2/ });
    expect(gallery.querySelector("button")).toBeNull();
    fireEvent.keyDown(gallery, { key: "ArrowRight" });
    await waitFor(() => expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.src).toContain("/second.jpg"));
    expect(gallery).toHaveAccessibleName(/2 de 2/);
    fireEvent.keyDown(gallery, { key: "ArrowLeft" });
    await waitFor(() => expect(container.querySelector<HTMLImageElement>(".swipe-media-foreground")!.src).toContain("/first.jpg"));
  });

  it("shows the first name without artificial ellipsis and exposes the details action", () => {
    renderWithProviders(<SwipeCard item={{ ...item, profiles: { display_name: "Evlyn Santos" } }} onSwipeComplete={vi.fn()} />);
    expect(screen.getByText("Evlyn")).toBeVisible();
    expect(screen.queryByText("Evlyn...")).toBeNull();
    expect(screen.getByText("Ver detalhes")).toBeVisible();
    expect(screen.getByText(item.category).compareDocumentPosition(screen.getByText("Ver detalhes")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes do item" }));
    expect(screen.getByText("Recolher")).toBeVisible();
  });

  it("reserves the measured information height and refits photos when that height changes", () => {
    let infoHeight = 290;
    const resize: Array<() => void> = [];
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: () => void) { resize.push(callback); }
      observe() {}
      disconnect() {}
    });
    const width = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(390);
    const height = vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(function(this: HTMLElement) {
      return 874 - 59 - Number.parseFloat(this.style.bottom || "0");
    });
    const info = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(() => infoHeight);
    try {
      const { container, unmount } = renderWithProviders(<SwipeCard item={{ ...item, item_images: [{ image_url: "/portrait.jpg" }] }} onSwipeComplete={vi.fn()} />);
      const viewport = container.querySelector<HTMLElement>(".swipe-photo-viewport")!;
      const photo = container.querySelector<HTMLImageElement>(".swipe-media-foreground")!;
      Object.defineProperties(photo, { naturalWidth: { value: 800 }, naturalHeight: { value: 1000 } });
      fireEvent.load(photo);
      act(() => resize.forEach(callback => callback()));
      expect(viewport.style.bottom).toBe("298px");
      expect(photo.style.maskSize).toBe("390px 487.5px");

      infoHeight = 420;
      act(() => resize.forEach(callback => callback()));
      act(() => resize.forEach(callback => callback()));
      expect(viewport.style.bottom).toBe("428px");
      expect(photo.style.maskSize).toBe("390px 387px");
      expect(photo.style.objectFit).toBe("cover");
      unmount();
    } finally {
      width.mockRestore(); height.mockRestore(); info.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
