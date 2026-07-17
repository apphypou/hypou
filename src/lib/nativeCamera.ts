import { Capacitor } from "@capacitor/core";
import { describeMediaFile, logMediaDiagnostic, logMediaError } from "@/lib/mediaDiagnostics";

/**
 * Native camera helper — uses Capacitor Camera on native platforms,
 * falls back to standard file input on web.
 */

export type MediaSource = "camera" | "gallery";

export type PickMediaOptions = {
  source: MediaSource;
  mediaType: "photo" | "video";
};

export interface PhotoResult {
  file: File;
  previewUrl: string;
}

export type NativeMediaResult = PhotoResult;

export const isNativePlatform = () => Capacitor.isNativePlatform();

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
};

// Keep native photos detailed enough for listings without asking iOS WebView to
// decode multiple full-resolution camera images while the focal-point editor is open.
const ITEM_PHOTO_MAX_DIMENSION = 1920;

type CapacitorMedia = {
  uri?: string;
  webPath?: string;
  metadata?: { format?: string };
};

type MediaTraceOptions = {
  traceId?: string;
};

const normalizeExtension = (format: string | undefined, fallback: string) => {
  const normalized = format?.toLowerCase().replace(/^\./, "");
  if (!normalized) return fallback;
  return normalized === "jpeg" ? "jpg" : normalized;
};

const toMediaResult = async (
  media: CapacitorMedia,
  namePrefix: string,
  fallbackExtension: string,
  fallbackMime: string,
  traceId?: string,
): Promise<NativeMediaResult> => {
  const source = media.webPath || (media.uri ? Capacitor.convertFileSrc(media.uri) : "");
  logMediaDiagnostic("native.media.source_received", {
    sourceKind: media.webPath ? "webPath" : media.uri ? "uri" : "missing",
    format: media.metadata?.format,
    namePrefix,
  }, traceId);
  if (!source) {
    throw new Error("O iOS não retornou o arquivo selecionado.");
  }

  let response: Response;
  try {
    response = await fetch(source);
  } catch (error) {
    logMediaError("native.media.fetch_failed", error, { namePrefix }, traceId);
    throw error;
  }
  if (!response.ok && response.status !== 0) {
    logMediaDiagnostic("native.media.fetch_rejected", { namePrefix, status: response.status }, traceId);
    throw new Error(`Não foi possível ler a foto selecionada (${response.status}).`);
  }
  const blob = await response.blob();
  logMediaDiagnostic("native.media.blob_ready", {
    namePrefix,
    blobType: blob.type || "unknown",
    blobSizeBytes: blob.size,
  }, traceId);
  if (blob.size === 0) {
    throw new Error("O arquivo selecionado está vazio.");
  }

  const extension = normalizeExtension(media.metadata?.format, fallbackExtension);
  const mimeType = blob.type && blob.type !== "application/octet-stream"
    ? blob.type
    : MIME_BY_EXTENSION[extension] || fallbackMime;
  const file = new File([blob], `${namePrefix}_${Date.now()}.${extension}`, {
    type: mimeType,
  });
  logMediaDiagnostic("native.media.file_ready", describeMediaFile(file), traceId);
  return { file, previewUrl: URL.createObjectURL(file) };
};

const isUserCancellation = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.toLowerCase().includes("cancel");
};

const mediaError = (action: string, error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error ?? "erro desconhecido");
  return new Error(`${action}. ${detail}`);
};

export const takePhoto = async (options?: MediaTraceOptions): Promise<PhotoResult | null> => {
  if (!isNativePlatform()) return null;

  try {
    logMediaDiagnostic("native.photo.camera_opened", undefined, options?.traceId);
    const { Camera, CameraDirection, EncodingType } = await import("@capacitor/camera");
    const photo = await Camera.takePhoto({
      quality: 85,
      targetWidth: ITEM_PHOTO_MAX_DIMENSION,
      targetHeight: ITEM_PHOTO_MAX_DIMENSION,
      correctOrientation: true,
      encodingType: EncodingType.JPEG,
      cameraDirection: CameraDirection.Rear,
      editable: "no",
      includeMetadata: true,
    });
    const result = await toMediaResult(photo, "photo", "jpg", "image/jpeg", options?.traceId);
    logMediaDiagnostic("native.photo.camera_complete", describeMediaFile(result.file), options?.traceId);
    return result;
  } catch (error: unknown) {
    if (isUserCancellation(error)) {
      logMediaDiagnostic("native.photo.camera_cancelled", undefined, options?.traceId);
      return null;
    }
    logMediaError("native.photo.camera_failed", error, undefined, options?.traceId);
    throw mediaError("Não foi possível tirar a foto", error);
  }
};

export const choosePhotosFromGallery = async (options?: {
  multiple?: boolean;
  maxFiles?: number;
  traceId?: string;
}): Promise<PhotoResult[]> => {
  if (!isNativePlatform()) return [];

  try {
    logMediaDiagnostic("native.photo.gallery_opened", {
      multiple: options?.multiple ?? false,
      maxFiles: options?.maxFiles ?? 1,
    }, options.traceId);
    const { Camera, MediaTypeSelection } = await import("@capacitor/camera");
    const galleryResult = await Camera.chooseFromGallery({
      mediaType: MediaTypeSelection.Photo,
      allowMultipleSelection: options?.multiple ?? false,
      limit: options?.maxFiles ?? 1,
      quality: 85,
      targetWidth: ITEM_PHOTO_MAX_DIMENSION,
      targetHeight: ITEM_PHOTO_MAX_DIMENSION,
      correctOrientation: true,
      editable: "no",
      includeMetadata: true,
    });
    const selected = galleryResult.results;
    logMediaDiagnostic("native.photo.gallery_selected", { selectedCount: selected.length }, options.traceId);
    const results = await Promise.all(
      selected.map((photo, index) => toMediaResult(photo, `photo_${index}`, "jpg", "image/jpeg", options.traceId)),
    );
    logMediaDiagnostic("native.photo.gallery_complete", { resultCount: results.length }, options.traceId);
    return results;
  } catch (error: unknown) {
    if (isUserCancellation(error)) {
      logMediaDiagnostic("native.photo.gallery_cancelled", undefined, options.traceId);
      return [];
    }
    logMediaError("native.photo.gallery_failed", error, undefined, options.traceId);
    throw mediaError("Não foi possível abrir a galeria", error);
  }
};

/**
 * Pick photo(s) using native camera/gallery on native, or trigger file input on web.
 * On native, shows action sheet to choose Camera or Gallery.
 * Returns array of { file, previewUrl }.
 */
export const pickPhotos = async (options?: {
  multiple?: boolean;
  maxFiles?: number;
  traceId?: string;
}): Promise<PhotoResult[]> => {
  if (!isNativePlatform()) {
    // Web fallback — caller should use file input
    return [];
  }

  return choosePhotosFromGallery(options);
};

export const chooseVideoFromGallery = async (options?: MediaTraceOptions): Promise<NativeMediaResult | null> => {
  if (!isNativePlatform()) return null;

  try {
    logMediaDiagnostic("native.video.gallery_opened", undefined, options?.traceId);
    const { Camera, MediaTypeSelection } = await import("@capacitor/camera");
    const { results } = await Camera.chooseFromGallery({
      mediaType: MediaTypeSelection.Video,
      allowMultipleSelection: false,
      limit: 1,
      includeMetadata: true,
    });
    const video = results[0];
    if (!video) {
      logMediaDiagnostic("native.video.gallery_empty", undefined, options?.traceId);
      return null;
    }
    const result = await toMediaResult(video, "video", "mp4", "video/mp4", options?.traceId);
    logMediaDiagnostic("native.video.gallery_complete", describeMediaFile(result.file), options?.traceId);
    return result;
  } catch (error: unknown) {
    if (isUserCancellation(error)) {
      logMediaDiagnostic("native.video.gallery_cancelled", undefined, options?.traceId);
      return null;
    }
    logMediaError("native.video.gallery_failed", error, undefined, options?.traceId);
    throw mediaError("Não foi possível escolher o vídeo", error);
  }
};

export const recordVideo = async (options?: MediaTraceOptions): Promise<NativeMediaResult | null> => {
  if (!isNativePlatform()) return null;

  try {
    logMediaDiagnostic("native.video.camera_opened", undefined, options?.traceId);
    const { Camera } = await import("@capacitor/camera");
    const video = await Camera.recordVideo({
      saveToGallery: false,
      includeMetadata: true,
      isPersistent: false,
    });
    const result = await toMediaResult(video, "video", "mov", "video/quicktime", options?.traceId);
    logMediaDiagnostic("native.video.camera_complete", describeMediaFile(result.file), options?.traceId);
    return result;
  } catch (error: unknown) {
    if (isUserCancellation(error)) {
      logMediaDiagnostic("native.video.camera_cancelled", undefined, options?.traceId);
      return null;
    }
    logMediaError("native.video.camera_failed", error, undefined, options?.traceId);
    throw mediaError("Não foi possível gravar o vídeo", error);
  }
};

/**
 * Pick a single photo for avatar using native camera.
 */
export const pickAvatar = async (): Promise<PhotoResult | null> => {
  const results = await pickPhotos({ multiple: false });
  return results[0] ?? null;
};
