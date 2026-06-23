import { AlertCircle, Check, CheckCheck, Clock3, Loader2, Play } from "lucide-react";
import { forwardRef, useState } from "react";
import { AudioPlayer } from "./AudioPlayer";
import MediaViewerDialog, { type MediaViewerItem } from "@/components/MediaViewerDialog";
import { getMessageDeliveryLabel, getMessageDeliveryStatus } from "@/lib/messageDeliveryStatus";

interface MessageListProps {
  messages: any[];
  isLoading: boolean;
  currentUserId: string | undefined;
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const renderMessageContent = (msg: any, isMine: boolean, openMedia: (media: MediaViewerItem) => void) => {
  const type = msg.message_type || "text";
  const mediaUrl = msg.media_url;

  if (type === "image" && mediaUrl) {
    return (
      <button type="button" onClick={() => openMedia({ url: mediaUrl, type: "image", alt: "Imagem do chat" })}>
        <img
          src={mediaUrl}
          alt="Imagem"
          className="rounded-xl max-w-full max-h-60 object-cover cursor-pointer"
        />
      </button>
    );
  }
  if (type === "video" && mediaUrl) {
    return (
      <button
        type="button"
        onClick={() => openMedia({ url: mediaUrl, type: "video", alt: "Vídeo do chat" })}
        className="relative overflow-hidden rounded-xl"
      >
        <video src={mediaUrl} muted playsInline className="rounded-xl max-w-full max-h-60" preload="metadata" />
        <span className="absolute inset-0 grid place-items-center bg-black/25">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/18 text-white backdrop-blur-md">
            <Play className="h-5 w-5 fill-current" />
          </span>
        </span>
      </button>
    );
  }
  if (type === "audio" && mediaUrl) {
    return <AudioPlayer src={mediaUrl} mine={isMine} />;
  }
  return <p className="text-sm leading-relaxed break-words">{msg.content}</p>;
};

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, isLoading, currentUserId }, ref) => {
    const [mediaViewer, setMediaViewer] = useState<MediaViewerItem | null>(null);

    return (
      <>
        <div ref={ref} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl mb-3">🤝</span>
              <p className="text-muted-foreground text-sm">
                Vocês deram match! Comece a negociar.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              const isSystem = msg.message_type === "system";
              const deliveryStatus = getMessageDeliveryStatus(msg, currentUserId);
              const deliveryLabel = getMessageDeliveryLabel(deliveryStatus);

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="max-w-[85%] rounded-full bg-foreground/5 border border-foreground/10 px-4 py-2 text-center">
                      <p className="text-xs text-foreground/70 leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      isMine
                        ? "bg-primary/70 text-primary-foreground rounded-br-md"
                        : "bg-card border border-foreground/5 text-foreground rounded-bl-md"
                    }`}
                  >
                    {renderMessageContent(msg, isMine, setMediaViewer)}
                    <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                      <span className={`text-[10px] ${isMine ? "text-primary-foreground/60" : "text-foreground/30"}`}>
                        {formatTime(msg.created_at)}
                      </span>
                      {deliveryStatus === "read" && (
                        <CheckCheck className="h-3.5 w-3.5 text-cyan-200" aria-label={deliveryLabel} />
                      )}
                      {deliveryStatus === "delivered" && (
                        <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/55" aria-label={deliveryLabel} />
                      )}
                      {deliveryStatus === "sent" && (
                        <Check className="h-3.5 w-3.5 text-primary-foreground/55" aria-label={deliveryLabel} />
                      )}
                      {deliveryStatus === "sending" && (
                        <Clock3 className="h-3.5 w-3.5 text-primary-foreground/45" aria-label={deliveryLabel} />
                      )}
                      {deliveryStatus === "failed" && (
                        <AlertCircle className="h-3.5 w-3.5 text-destructive-foreground" aria-label={deliveryLabel} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <MediaViewerDialog media={mediaViewer} onOpenChange={(open) => !open && setMediaViewer(null)} />
      </>
    );
  }
);
MessageList.displayName = "MessageList";
