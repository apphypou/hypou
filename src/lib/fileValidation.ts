const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mpeg'];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

export const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP.';
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
