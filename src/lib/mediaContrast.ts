export type MediaTone = "bright" | "neutral" | "dark";

export const classifyLuminance = (luminance: number): MediaTone => {
  if (!Number.isFinite(luminance)) return "neutral";
  if (luminance >= 188) return "bright";
  if (luminance <= 82) return "dark";
  return "neutral";
};

export const classifyRgbaSamples = (data: Uint8ClampedArray): MediaTone => {
  if (!data.length) return "neutral";

  let total = 0;
  let count = 0;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] ?? 255;
    if (alpha < 24) continue;

    const red = data[index] ?? 0;
    const green = data[index + 1] ?? 0;
    const blue = data[index + 2] ?? 0;

    total += red * 0.2126 + green * 0.7152 + blue * 0.0722;
    count += 1;
  }

  return classifyLuminance(count ? total / count : 128);
};

export const measureImageTone = (image: HTMLImageElement): MediaTone => {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext?.("2d", { willReadFrequently: true });
    if (!context) return "neutral";

    const width = Math.max(1, Math.min(24, image.naturalWidth || image.width || 1));
    const height = Math.max(1, Math.min(24, image.naturalHeight || image.height || 1));
    canvas.width = width;
    canvas.height = height;

    context.drawImage(image, 0, 0, width, height);
    return classifyRgbaSamples(context.getImageData(0, 0, width, height).data);
  } catch {
    return "neutral";
  }
};
