export type MediaFocalPoint = {
  focal_x?: number | null;
  focal_y?: number | null;
  focal_scale?: number | null;
};

export const DEFAULT_FOCAL_POINT = { x: 50, y: 50 };

export const clampPercent = (value: unknown, fallback = 50) => {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(100, Math.max(0, number));
};

export const getMediaObjectPosition = (image?: MediaFocalPoint | null) => {
  const x = clampPercent(image?.focal_x, DEFAULT_FOCAL_POINT.x);
  const y = clampPercent(image?.focal_y, DEFAULT_FOCAL_POINT.y);
  return `${x}% ${y}%`;
};

export const getMediaScale = (image?: MediaFocalPoint | null) => {
  const scale = typeof image?.focal_scale === "number" ? image.focal_scale : Number(image?.focal_scale);
  if (!Number.isFinite(scale)) return 1;
  return Math.min(4, Math.max(1, scale));
};

type CropOffsetInput = {
  imageWidth: number;
  imageHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  x: number;
  y: number;
};

export const clampCropOffset = ({
  imageWidth,
  imageHeight,
  viewportWidth,
  viewportHeight,
  zoom,
  x,
  y,
}: CropOffsetInput) => {
  if (![imageWidth, imageHeight, viewportWidth, viewportHeight].every(Number.isFinite)) return { x: 0, y: 0 };

  const scale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight) * Math.max(1, zoom);
  const maxX = Math.max(0, (imageWidth * scale - viewportWidth) / 2);
  const maxY = Math.max(0, (imageHeight * scale - viewportHeight) / 2);
  const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

  return {
    x: Number(clamp(x, maxX).toFixed(2)),
    y: Number(clamp(y, maxY).toFixed(2)),
  };
};
