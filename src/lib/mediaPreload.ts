const imagePreloadCache = new Map<string, Promise<void>>();
const videoPreloadCache = new Map<string, Promise<void>>();
const MAX_IMAGE_PRELOADS = 12;
const MAX_VIDEO_PRELOADS = 2;

const touchCacheEntry = <T>(cache: Map<string, T>, key: string, value: T) => {
  cache.delete(key);
  cache.set(key, value);
};

const trimCache = <T>(cache: Map<string, T>, maxEntries: number) => {
  while (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) return;
    cache.delete(oldestKey);
  }
};

export function preloadImage(src: string | null | undefined): Promise<void> {
  if (!src) return Promise.resolve();

  const cached = imagePreloadCache.get(src);
  if (cached) {
    touchCacheEntry(imagePreloadCache, src, cached);
    return cached;
  }

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
  trimCache(imagePreloadCache, MAX_IMAGE_PRELOADS);
  preload.catch(() => imagePreloadCache.delete(src));

  return preload;
}

export function preloadImages(srcs: Array<string | null | undefined>): Promise<void[]> {
  return Promise.all(srcs.filter(Boolean).map((src) => preloadImage(src)));
}

export function preloadVideo(src: string | null | undefined): Promise<void> {
  if (!src) return Promise.resolve();

  const cached = videoPreloadCache.get(src);
  if (cached) {
    touchCacheEntry(videoPreloadCache, src, cached);
    return cached;
  }

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
  trimCache(videoPreloadCache, MAX_VIDEO_PRELOADS);
  preload.catch(() => videoPreloadCache.delete(src));

  return preload;
}

export function preloadVideos(srcs: Array<string | null | undefined>): Promise<void[]> {
  return Promise.all(srcs.filter(Boolean).map((src) => preloadVideo(src)));
}

export const __resetMediaPreloadCacheForTests = () => {
  imagePreloadCache.clear();
  videoPreloadCache.clear();
};

export const __getMediaPreloadCacheSizesForTests = () => ({
  images: imagePreloadCache.size,
  videos: videoPreloadCache.size,
});
