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
    let loadHandler: (() => void) | null = null;

    class MockImage {
      onerror: (() => void) | null = null;

      get onload() {
        return loadHandler;
      }

      set onload(handler: (() => void) | null) {
        loadHandler = handler;
      }

      set src(_value: string) {}
    }

    globalThis.Image = MockImage as unknown as typeof Image;

    const promise = preloadImage("https://cdn.example.com/fallback.jpg");
    loadHandler?.();

    await expect(promise).resolves.toBeUndefined();
  });

  it("does not let onload resolve ahead of decoding", async () => {
    let finishDecode!: () => void;
    let load!: () => void;
    class MockImage {
      set onload(handler: () => void) { load = handler; }
      onerror = null;
      decode = () => new Promise<void>((resolve) => { finishDecode = resolve; });
      set src(_value: string) {}
    }
    globalThis.Image = MockImage as unknown as typeof Image;
    const ready = vi.fn();
    const preload = preloadImage("https://cdn.example.com/slow-decode.jpg").then(ready);
    load();
    await Promise.resolve();
    expect(ready).not.toHaveBeenCalled();
    finishDecode();
    await preload;
    expect(ready).toHaveBeenCalledOnce();
  });

  it("uses an already completed load when decode rejects", async () => {
    let rejectDecode!: (error: Error) => void;
    let load!: () => void;
    class MockImage {
      set onload(handler: () => void) { load = handler; }
      onerror = null;
      decode = () => new Promise<void>((_, reject) => { rejectDecode = reject; });
      set src(_value: string) {}
    }
    globalThis.Image = MockImage as unknown as typeof Image;
    const preload = preloadImage("https://cdn.example.com/decode-fallback.jpg");
    load();
    rejectDecode(new Error("decode unavailable"));
    await expect(preload).resolves.toBeUndefined();
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

  it("reuses an already requested image instead of starting another download", async () => {
    const decode = vi.fn().mockResolvedValue(undefined);
    const assignedSources: string[] = [];

    class MockImage {
      decode = decode;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(value: string) { assignedSources.push(value); }
    }

    globalThis.Image = MockImage as unknown as typeof Image;
    await Promise.all([
      preloadImage("https://cdn.example.com/cached.jpg"),
      preloadImage("https://cdn.example.com/cached.jpg"),
    ]);

    expect(assignedSources).toEqual(["https://cdn.example.com/cached.jpg"]);
  });

  it("bounds decoded image retention and reuses the matching CORS request", async () => {
    const assignedSources: string[] = [];
    const corsModes: Array<string | undefined> = [];
    class MockImage {
      crossOrigin?: string;
      decode = () => Promise.resolve();
      set src(value: string) {
        assignedSources.push(value);
        corsModes.push(this.crossOrigin);
      }
    }
    globalThis.Image = MockImage as unknown as typeof Image;
    for (let i = 0; i < 17; i++) await preloadImage(`https://cdn.example.com/window-${i}.jpg`, "anonymous");
    await preloadImage("https://cdn.example.com/window-16.jpg", "anonymous");
    expect(assignedSources).toHaveLength(17);
    await preloadImage("https://cdn.example.com/window-0.jpg", "anonymous");
    expect(assignedSources).toHaveLength(18);
    expect(corsModes.every(mode => mode === "anonymous")).toBe(true);
    await preloadImage("https://cdn.example.com/window-16.jpg");
    expect(corsModes.at(-1)).toBeUndefined();
  });
});
