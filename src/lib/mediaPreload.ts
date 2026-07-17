const imagePreloadCache = new Map<string, Promise<void>>();
const videoPreloadCache = new Map<string, Promise<void>>();

export function preloadImage(src: string | null | undefined): Promise<void> {
  if (!src) return Promise.resolve();

  const cached = imagePreloadCache.get(src);
  if (cached) return cached;

  const preload = new Promise<void>((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));

    img.src = src;

    if (typeof img.decode === "function") {
      img.decode().then(resolve).catch(() => {
        // Some browsers reject decode for images that still finish loading.
        // Keep the load/error handlers as the compatibility path.
      });
    }
  });

  imagePreloadCache.set(src, preload);
  preload.catch(() => imagePreloadCache.delete(src));

  return preload;
}

export function preloadImages(srcs: Array<string | null | undefined>): Promise<void[]> {
  return Promise.all(srcs.filter(Boolean).map((src) => preloadImage(src)));
}

export function preloadVideo(src: string | null | undefined): Promise<void> {
  if (!src) return Promise.resolve();

  const cached = videoPreloadCache.get(src);
  if (cached) return cached;

  const preload = new Promise<void>((resolve, reject) => {
    const video = document.createElement("video");

    const cleanup = () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`Failed to preload video: ${src}`));
    };

    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("loadeddata", onReady, { once: true });
    video.addEventListener("canplay", onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.src = src;
    video.load();
  });

  videoPreloadCache.set(src, preload);
  preload.catch(() => videoPreloadCache.delete(src));

  return preload;
}

export function preloadVideos(srcs: Array<string | null | undefined>): Promise<void[]> {
  return Promise.all(srcs.filter(Boolean).map((src) => preloadVideo(src)));
}
