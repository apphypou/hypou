/**
 * Supabase Storage image transformations.
 * Rewrites public object URLs to the on-the-fly render endpoint so the CDN
 * delivers a resized, recompressed variant instead of the original asset.
 *
 * Works for any public bucket. Returns the original URL untouched for
 * non-Supabase URLs (data:, blob:, external links, etc.) so it's safe to
 * apply globally.
 *
 * Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
 */

export type ImgOpts = {
  /** Target width in px (height auto). Defaults to 1080. */
  width?: number;
  /** Target height in px (optional). */
  height?: number;
  /** JPEG/WebP quality 20-100. Defaults to 75. */
  quality?: number;
  /** Resize strategy. Defaults to "contain" to preserve aspect ratio. */
  resize?: "cover" | "contain" | "fill";
};

export function cdnImage(url: string | null | undefined, opts: ImgOpts = {}): string {
  if (!url) return "";
  // Only rewrite Supabase public-object URLs
  const marker = "/storage/v1/object/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const { width = 1080, height, quality = 75, resize = "contain" } = opts;
  const base = url.slice(0, idx) + "/storage/v1/render/image/public/" + url.slice(idx + marker.length);
  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  if (quality) params.set("quality", String(quality));
  if (resize) params.set("resize", resize);
  return `${base}?${params.toString()}`;
}

/** Preset for fullscreen swipe / item detail images. */
export const cdnFull = (url: string | null | undefined) => cdnImage(url, { width: 1080, quality: 75 });
/** Preset for medium tiles (match cards, previews). */
export const cdnMedium = (url: string | null | undefined) => cdnImage(url, { width: 600, quality: 72 });
/** Preset for small thumbnails (chat header, lists, rating items). */
export const cdnThumb = (url: string | null | undefined) => cdnImage(url, { width: 240, quality: 70 });
/** Preset for the blurred background reflection — tiny + low quality. */
export const cdnBlur = (url: string | null | undefined) =>
  cdnImage(url, { width: 64, quality: 35, resize: "cover" });
