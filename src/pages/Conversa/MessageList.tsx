import { Loader2, Check, CheckCheck } from "lucide-react";
import { forwardRef } from "react";
import { AudioPlayer } from "./AudioPlayer";

interface MessageListProps {
  messages: any[];
  isLoading: boolean;
  currentUserId: string | undefined;
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const renderMessageContent = (msg: any, isMine: boolean) => {
  const type = msg.message_type || "text";
  const mediaUrl = msg.media_url;

  if (type === "image" && mediaUrl) {
    return (
      <img
        src={mediaUrl}
        alt="Imagem"
        className="rounded-xl max-w-full max-h-60 object-cover cursor-pointer"
        onClick={() => window.open(mediaUrl, "_blank")}
      />
    );
  }
  if (type === "video" && mediaUrl) {
    return (
      <video src={mediaUrl} controls className="rounded-xl max-w-full max-h-60" preload="metadata" />
    );
  }
  if (type === "audio" && mediaUrl) {
    return <AudioPlayer src={mediaUrl} mine={isMine} />;
  }
  return <p className="text-sm leading-relaxed break-words">{msg.content}</p>;
};

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, isLoading, currentUserId }, ref) => {
    return (
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
                  {renderMessageContent(msg)}
                  <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                    <span className={`text-[10px] ${isMine ? "text-primary-foreground/60" : "text-foreground/30"}`}>
                      {formatTime(msg.created_at)}
                    </span>
                    {isMine &&
                      (msg.read_at ? (
                        <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                      ) : (
                        <Check className="h-3 w-3 text-primary-foreground/40" />
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }
);
MessageList.displayName = "MessageList";
