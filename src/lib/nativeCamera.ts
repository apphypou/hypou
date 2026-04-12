import { Capacitor } from "@capacitor/core";

/**
 * Native camera helper — uses Capacitor Camera on native platforms,
 * falls back to standard file input on web.
 */

interface PhotoResult {
  file: File;
  previewUrl: string;
}

export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * Pick photo(s) using native camera/gallery on native, or trigger file input on web.
 * On native, shows action sheet to choose Camera or Gallery.
 * Returns array of { file, previewUrl }.
 */
export const pickPhotos = async (options?: {
  multiple?: boolean;
  maxFiles?: number;
}): Promise<PhotoResult[]> => {
  if (!isNativePlatform()) {
    // Web fallback — caller should use file input
    return [];
  }

  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");

    if (options?.multiple) {
      const { photos } = await Camera.pickImages({
        quality: 85,
        limit: options.maxFiles ?? 5,
      });

      const results: PhotoResult[] = [];
      for (const photo of photos) {
        if (photo.webPath) {
          const response = await fetch(photo.webPath);
          const blob = await response.blob();
          const file = new File([blob], `photo_${Date.now()}_${results.length}.jpg`, {
            type: blob.type || "image/jpeg",
          });
          results.push({ file, previewUrl: photo.webPath });
        }
      }
      return results;
    }

    // Single photo — offer camera or gallery
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      promptLabelHeader: "Foto",
      promptLabelPhoto: "Galeria",
      promptLabelPicture: "Câmera",
    });

    if (photo.webPath) {
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: blob.type || "image/jpeg",
      });
      return [{ file, previewUrl: photo.webPath }];
    }

    return [];
  } catch (err: any) {
    // User cancelled
    if (err?.message?.includes("cancelled") || err?.message?.includes("User cancelled")) {
      return [];
    }
    console.error("Native camera error:", err);
    return [];
  }
};

/**
 * Pick a single photo for avatar using native camera.
 */
export const pickAvatar = async (): Promise<PhotoResult | null> => {
  const results = await pickPhotos({ multiple: false });
  return results[0] ?? null;
};
