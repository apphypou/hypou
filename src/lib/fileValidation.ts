const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_HEIC_TYPES = ['image/heic', 'image/heif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mpeg'];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_HEIC_SIZE = 15 * 1024 * 1024; // 15MB (raw HEIC, will be compressed)
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

/** Detect HEIC even when browsers don't set MIME (iOS Safari often returns ""). */
export const isHeicFile = (file: File): boolean => {
  if (ALLOWED_HEIC_TYPES.includes(file.type)) return true;
  const ext = file.name.toLowerCase().split('.').pop();
  return ext === 'heic' || ext === 'heif';
};

export const validateImageFile = (file: File): string | null => {
  if (isHeicFile(file)) {
    if (file.size > MAX_HEIC_SIZE) return 'Imagem HEIC muito grande. Máximo 15MB.';
    return null; // accepted — caller is responsible for converting
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Tipo de arquivo não permitido. Use JPG, PNG, WebP ou HEIC (iPhone).';
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return 'Imagem muito grande. Máximo 5MB.';
  }
  return null;
};

export const validateVideoFile = (file: File): string | null => {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return 'Tipo de vídeo não permitido. Use MP4 ou WebM.';
  }
  if (file.size > MAX_VIDEO_SIZE) {
    return 'Vídeo muito grande. Máximo 50MB.';
  }
  return null;
};

export const validateAudioFile = (file: File): string | null => {
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return 'Tipo de áudio não permitido.';
  }
  if (file.size > MAX_AUDIO_SIZE) {
    return 'Áudio muito grande. Máximo 10MB.';
  }
  return null;
};

export const validateChatMedia = (file: File, type: 'image' | 'video' | 'audio'): string | null => {
  switch (type) {
    case 'image': return validateImageFile(file);
    case 'video': return validateVideoFile(file);
    case 'audio': return validateAudioFile(file);
    default: return 'Tipo de mídia não suportado.';
  }
};

/**
 * Convert HEIC/HEIF to JPEG using heic2any (browser-only).
 * Returns the original file if it's not HEIC, or if conversion fails.
 * On native iOS via Capacitor Camera, files are already returned as JPEG.
 */
export const ensureWebCompatibleImage = async (file: File): Promise<File> => {
  if (!isHeicFile(file)) return file;
  try {
    const { default: heic2any } = await import('heic2any');
    const blob = (await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })) as Blob;
    const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
  } catch (err) {
    console.warn('HEIC conversion failed:', err);
    return file; // fall back; upload may fail but we tried
  }
};
