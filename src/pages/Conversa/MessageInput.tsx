import { Image as ImageIcon, Video, Mic, MicOff, Loader2, Send } from "lucide-react";
import { useRef } from "react";
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
  onStopRecording: () => void;
  onFileSelect: (file: File, type: MessageType) => void;
}

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

  const handleImagePick = () => fileInputRef.current?.click();
  const handleVideoPick = () => videoInputRef.current?.click();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
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
        {showAttachMenu && (
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
            <button
              onClick={onStartRecording}
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-card border border-foreground/10 hover:border-primary/50 transition-all"
            >
              <Mic className="h-5 w-5 text-primary" />
              <span className="text-[10px] text-foreground/60 font-medium">Áudio</span>
            </button>
          </div>
        )}

        {isRecording && (
          <div className="flex items-center gap-3 mb-3 px-4 py-3 rounded-2xl bg-destructive/10 border border-destructive/20">
            <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm text-destructive font-medium flex-1">Gravando áudio...</span>
            <button
              onClick={onStopRecording}
              className="h-9 w-9 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <MicOff className="h-4 w-4" />
            </button>
          </div>
        )}

        {uploading && (
          <div className="flex items-center gap-2 mb-3 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
            <span className="text-xs text-primary font-medium">Enviando mídia...</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center bg-card/60 backdrop-blur-xl border border-foreground/10 rounded-full pl-5 pr-2 py-1.5 shadow-sm">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              rows={1}
              disabled={isRecording || uploading}
              className="flex-1 bg-transparent border-0 text-foreground focus:outline-none placeholder:text-foreground/30 resize-none text-sm max-h-32 disabled:opacity-50 py-2"
              style={{ minHeight: "28px" }}
            />
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onStartRecording}
                disabled={isRecording || uploading}
                className="h-9 w-9 rounded-full bg-background/60 border border-foreground/10 text-foreground/70 hover:text-primary flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                aria-label="Gravar audio"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                onClick={handleImagePick}
                disabled={isRecording || uploading}
                className="h-9 w-9 rounded-full bg-background/60 border border-foreground/10 text-foreground/70 hover:text-primary flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                aria-label="Enviar imagem"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <button
            onClick={onSend}
            disabled={!text.trim() || sending || isRecording || uploading}
            className="h-11 w-11 shrink-0 rounded-full text-primary-foreground flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:active:scale-100 shadow-lg bg-gradient-to-br from-primary to-[hsl(260_85%_65%)]"
            aria-label="Enviar"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </>
  );
};
