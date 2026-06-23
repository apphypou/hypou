export type MediaFocalPoint = {
  focal_x?: number | null;
  focal_y?: number | null;
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

