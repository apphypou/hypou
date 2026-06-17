import { afterEach, describe, expect, it, vi } from "vitest";
import { preloadImage, preloadVideo } from "@/lib/mediaPreload";

describe("mediaPreload", () => {
  const originalImage = globalThis.Image;

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.Image = originalImage;
  });

  it("decodes an image before resolving so gallery slide changes can be instant", async () => {
    const decode = vi.fn().mockResolvedValue(undefined);
    const assignedSources: string[] = [];

    class MockImage {
      decode = decode;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(value: string) {
        assignedSources.push(value);
      }
    }

    globalThis.Image = MockImage as unknown as typeof Image;

    await preloadImage("https://cdn.example.com/photo.jpg");

    expect(assignedSources).toEqual(["https://cdn.example.com/photo.jpg"]);
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it("falls back to load events when decode is unavailable", async () => {
    let instance: { onload: (() => void) | null } | null = null;

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor() {
        instance = this;
      }

      set src(_value: string) {}
    }

    globalThis.Image = MockImage as unknown as typeof Image;

    const promise = preloadImage("https://cdn.example.com/fallback.jpg");
    instance?.onload?.();

    await expect(promise).resolves.toBeUndefined();
  });

  it("waits for a playable video frame before resolving", async () => {
    const video = {
      preload: "",
      muted: false,
      playsInline: false,
      src: "",
      load: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(video as unknown as HTMLVideoElement);

    const promise = preloadVideo("https://cdn.example.com/clip.mp4");
    const loadedDataHandler = video.addEventListener.mock.calls.find(([event]) => event === "loadeddata")?.[1];

    expect(video.preload).toBe("auto");
    expect(video.muted).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(video.src).toBe("https://cdn.example.com/clip.mp4");
    expect(video.load).toHaveBeenCalledTimes(1);

    loadedDataHandler?.();

    await expect(promise).resolves.toBeUndefined();
  });
});
