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
  webp: "image/webp",
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
  format?: string;
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

export const resolveNativeMediaFileType = (
  format: string | undefined,
  blobType: string,
  fallbackExtension: string,
  fallbackMime: string,
) => {
  const extension = normalizeExtension(format, fallbackExtension);
  const nativeMime = format ? MIME_BY_EXTENSION[extension] : undefined;
  const fetchedMime = blobType && blobType !== "application/octet-stream" ? blobType : undefined;

  return {
    extension,
    mimeType: nativeMime || fetchedMime || MIME_BY_EXTENSION[extension] || fallbackMime,
  };
};

const asciiAt = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.slice(start, start + length)).toLowerCase();

export const detectMediaFormatFromBytes = (bytes: Uint8Array): string | undefined => {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (bytes.length >= 12 && asciiAt(bytes, 0, 4) === "riff" && asciiAt(bytes, 8, 4) === "webp") {
    return "webp";
  }
  if (bytes.length >= 12 && asciiAt(bytes, 4, 4) === "ftyp") {
    const brand = asciiAt(bytes, 8, 4);
    if (["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs"].includes(brand)) {
      return "heic";
    }
    if (["mif1", "msf1"].includes(brand)) {
      return "heif";
    }
  }
  return undefined;
};

const detectBlobFormat = async (blob: Blob) => {
  const header = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  return detectMediaFormatFromBytes(header);
};

const toMediaResult = async (
  media: CapacitorMedia,
  namePrefix: string,
  fallbackExtension: string,
  fallbackMime: string,
  traceId?: string,
): Promise<NativeMediaResult> => {
  const source = media.webPath || (media.uri ? Capacitor.convertFileSrc(media.uri) : "");
  const nativeFormat = media.format || media.metadata?.format;
  logMediaDiagnostic("native.media.source_received", {
    sourceKind: media.webPath ? "webPath" : media.uri ? "uri" : "missing",
    format: nativeFormat,
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

  const detectedFormat = await detectBlobFormat(blob);
  logMediaDiagnostic("native.media.signature_checked", {
    namePrefix,
    detectedFormat: detectedFormat || "unknown",
    nativeFormat: nativeFormat || "unknown",
    blobType: blob.type || "unknown",
  }, traceId);

  const { extension, mimeType } = resolveNativeMediaFileType(
    detectedFormat || nativeFormat,
    blob.type,
    fallbackExtension,
    fallbackMime,
  );
  if ((detectedFormat || nativeFormat) && blob.type && blob.type !== mimeType) {
    logMediaDiagnostic("native.media.mime_corrected", {
      format: detectedFormat || nativeFormat,
      fetchedMime: blob.type,
      resolvedMime: mimeType,
    }, traceId);
  }
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

// Native details are logged above; they are often in English and should not reach the user.
const mediaError = (action: string) => new Error(action);

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
    throw mediaError("Não foi possível tirar a foto");
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
    const maxFiles = options?.maxFiles ?? 1;
    const selected = Capacitor.getPlatform() === "ios"
      ? (await Camera.pickImages({
          quality: 85,
          width: ITEM_PHOTO_MAX_DIMENSION,
          height: ITEM_PHOTO_MAX_DIMENSION,
          correctOrientation: true,
          limit: maxFiles,
        })).photos
      : (await Camera.chooseFromGallery({
          mediaType: MediaTypeSelection.Photo,
          allowMultipleSelection: options?.multiple ?? false,
          limit: maxFiles,
          quality: 85,
          targetWidth: ITEM_PHOTO_MAX_DIMENSION,
          targetHeight: ITEM_PHOTO_MAX_DIMENSION,
          correctOrientation: true,
          editable: "no",
          includeMetadata: true,
        })).results;
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
    throw mediaError("Não foi possível abrir a galeria");
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
    throw mediaError("Não foi possível escolher o vídeo");
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
    throw mediaError("Não foi possível gravar o vídeo");
  }
};

/**
 * Pick a single photo for avatar using native camera.
 */
export const pickAvatar = async (): Promise<PhotoResult | null> => {
  const results = await pickPhotos({ multiple: false });
  return results[0] ?? null;
};
