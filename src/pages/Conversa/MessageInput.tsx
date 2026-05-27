import { Image as ImageIcon, Video, Mic, Loader2, Send, Trash2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import type { MessageType } from "@/services/messageService";

interface MessageInputProps {
  text: string;
  setText: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  uploading: boolean;
  isRecording: boolean;
  showAttachMenu: boolean;
  setShowAttachMenu: (v: boolean) => void;
  onStartRecording: () => void;
  onStopRecording: (cancel?: boolean) => void;
  onFileSelect: (file: File, type: MessageType) => void;
}

const formatDuration = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export const MessageInput = ({
  text,
  setText,
  onSend,
  sending,
  uploading,
  isRecording,
  showAttachMenu,
  onStartRecording,
  onStopRecording,
  onFileSelect,
}: MessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [duration, setDuration] = useState(0);
  const cancelRef = useRef(false);
  const startYRef = useRef(0);
  const [slideOffset, setSlideOffset] = useState(0);
  const willCancel = slideOffset < -60;

  const handleImagePick = () => fileInputRef.current?.click();
  const handleVideoPick = () => videoInputRef.current?.click();

  const hasText = text.trim().length > 0;

  // Recording timer
  useEffect(() => {
    if (!isRecording) {
      setDuration(0);
      setSlideOffset(0);
      return;
    }
    const id = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Hold-to-record handlers (mouse + touch)
  const handleHoldStart = (e: React.PointerEvent) => {
    if (hasText || uploading || sending) return;
    e.preventDefault();
    cancelRef.current = false;
    startYRef.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    onStartRecording();
  };

  const handleHoldMove = (e: React.PointerEvent) => {
    if (!isRecording) return;
    const delta = e.clientY - startYRef.current;
    setSlideOffset(Math.min(0, delta));
    if (delta < -80) cancelRef.current = true;
    else cancelRef.current = false;
  };

  const handleHoldEnd = (e: React.PointerEvent) => {
    if (!isRecording) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    onStopRecording(cancelRef.current);
    cancelRef.current = false;
    setSlideOffset(0);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file, "video");
          e.target.value = "";
        }}
      />

      <div className="shrink-0 px-4 pb-8 pt-3 border-t border-foreground/5 bg-background/80 backdrop-blur-xl">
        {showAttachMenu && !isRecording && (
          <div className="flex items-center gap-2 mb-3 animate-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={handleImagePick}
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-card border border-foreground/10 hover:border-primary/50 transition-all"
            >
              <ImageIcon className="h-5 w-5 text-primary" />
              <span className="text-[10px] text-foreground/60 font-medium">Imagem</span>
            </button>
            <button
              onClick={handleVideoPick}
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-card border border-foreground/10 hover:border-primary/50 transition-all"
            >
              <Video className="h-5 w-5 text-primary" />
              <span className="text-[10px] text-foreground/60 font-medium">Vídeo</span>
            </button>
          </div>
        )}

        {uploading && (
          <div className="flex items-center gap-2 mb-3 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
            <span className="text-xs text-primary font-medium">Enviando mídia...</span>
          </div>
        )}

        {isRecording ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 bg-card/60 backdrop-blur-xl border border-destructive/30 rounded-full pl-5 pr-3 h-11">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-mono text-foreground/80 tabular-nums">{formatDuration(duration)}</span>
              <span className={`flex-1 text-xs text-center transition-colors ${willCancel ? "text-destructive font-semibold" : "text-foreground/50"}`}>
                {willCancel ? "Solte para cancelar" : "← Arraste para cancelar"}
              </span>
              <button
                onPointerDown={(e) => { cancelRef.current = true; onStopRecording(true); }}
                className="h-9 w-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0"
                aria-label="Cancelar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <button
              onPointerDown={handleHoldStart}
              onPointerMove={handleHoldMove}
              onPointerUp={handleHoldEnd}
              onPointerCancel={handleHoldEnd}
              style={{ transform: `translateY(${slideOffset}px) scale(${willCancel ? 0.9 : 1.15})` }}
              className="h-11 w-11 shrink-0 rounded-full text-primary-foreground flex items-center justify-center shadow-lg bg-gradient-to-br from-destructive to-destructive/70 transition-transform"
              aria-label="Solte para enviar"
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 relative flex items-center bg-card/60 backdrop-blur-xl border border-foreground/10 rounded-full pl-5 pr-2 py-1.5 shadow-sm">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                disabled={uploading}
                className="flex-1 bg-transparent border-0 text-foreground focus:outline-none placeholder:text-foreground/30 resize-none max-h-32 disabled:opacity-50 py-2"
                style={{ minHeight: "28px", fontSize: "16px" }}
              />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleImagePick}
                  disabled={uploading}
                  className="h-9 w-9 rounded-full bg-background/60 border border-foreground/10 text-foreground/70 hover:text-primary flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                  aria-label="Enviar imagem"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            {hasText ? (
              <button
                onClick={onSend}
                disabled={sending || uploading}
                className="h-11 w-11 shrink-0 rounded-full text-primary-foreground flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:active:scale-100 shadow-lg bg-gradient-to-br from-primary to-[hsl(260_85%_65%)]"
                aria-label="Enviar"
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            ) : (
              <button
                onPointerDown={handleHoldStart}
                onPointerMove={handleHoldMove}
                onPointerUp={handleHoldEnd}
                onPointerCancel={handleHoldEnd}
                disabled={uploading}
                className="h-11 w-11 shrink-0 rounded-full text-primary-foreground flex items-center justify-center transition-all active:scale-110 disabled:opacity-30 shadow-lg bg-gradient-to-br from-primary to-[hsl(260_85%_65%)] select-none touch-none"
                aria-label="Segure para gravar áudio"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
