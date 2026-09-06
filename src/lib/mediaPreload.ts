// Retain a bounded set of decoded images, not just resolved promises. Otherwise
// WebKit may discard the pixels before the next card is mounted.
const imagePreloadCache = new Map<string, { image: HTMLImageElement; promise: Promise<void> }>();
const videoPreloadCache = new Map<string, Promise<void>>();

export function preloadImage(src: string | null | undefined, crossOrigin?: "anonymous"): Promise<void> {
  if (!src) return Promise.resolve();

  const key = `${crossOrigin ?? "default"}:${src}`;
  const cached = imagePreloadCache.get(key);
  if (cached) {
    imagePreloadCache.delete(key);
    imagePreloadCache.set(key, cached);
    return cached.promise;
  }

  const img = new Image();
  if (crossOrigin) img.crossOrigin = crossOrigin;
  const preload = new Promise<void>((resolve, reject) => {
    let loaded = false;
    let decodeFailed = false;
    img.onload = () => {
      loaded = true;
      if (typeof img.decode !== "function" || decodeFailed) resolve();
    };
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));

    img.src = src;

    if (typeof img.decode === "function") {
      img.decode().then(resolve).catch(() => {
        decodeFailed = true;
        if (loaded) resolve();
      });
    }
  });

  imagePreloadCache.set(key, { image: img, promise: preload });
  if (imagePreloadCache.size > 16) {
    imagePreloadCache.delete(imagePreloadCache.keys().next().value!);
  }
  preload.catch(() => {
    if (imagePreloadCache.get(key)?.promise === preload) imagePreloadCache.delete(key);
  });

  return preload;
}

export function preloadImages(srcs: Array<string | null | undefined>): Promise<void[]> {
  return Promise.all(srcs.filter(Boolean).map((src) => preloadImage(src)));
}

export function preloadVideo(src: string | null | undefined): Promise<void> {
  if (!src) return Promise.resolve();

  const cached = videoPreloadCache.get(src);
  if (cached) {
    videoPreloadCache.delete(src);
    videoPreloadCache.set(src, cached);
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
  if (videoPreloadCache.size > 4) videoPreloadCache.delete(videoPreloadCache.keys().next().value!);
  preload.catch(() => {
    if (videoPreloadCache.get(src) === preload) videoPreloadCache.delete(src);
  });

  return preload;
}

export function preloadVideos(srcs: Array<string | null | undefined>): Promise<void[]> {
  return Promise.all(srcs.filter(Boolean).map((src) => preloadVideo(src)));
}
