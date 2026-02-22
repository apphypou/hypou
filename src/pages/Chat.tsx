import { MessageSquare, Loader2 } from "lucide-react";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import { useConversations } from "@/hooks/useMessages";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Chat = () => {
  const { data: conversations = [], isLoading } = useConversations();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <ScreenLayout>
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-12 pb-4 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-0.5">
            Negociações
          </span>
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
            Conversas
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-primary text-xs font-semibold">
            {conversations.filter((c) => c.unread_count > 0).length} nova{conversations.filter((c) => c.unread_count > 0).length !== 1 ? "s" : ""}
          </span>
          {conversations.some((c) => c.unread_count > 0) && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary neon-glow" />
          )}
        </div>
      </header>

      <main className="relative flex-1 w-full px-5 overflow-y-auto no-scrollbar z-10 pb-28">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">💬</span>
            <h2 className="text-xl font-bold text-foreground mb-2">Nenhuma conversa ainda</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Faça um match para começar a negociar trocas!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map((conv) => {
              const hasUnread = conv.unread_count > 0;
              const lastMsg = conv.last_message;
              const isMyLastMsg = lastMsg?.sender_id === user?.id;
              const timeAgo = lastMsg
                ? formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: false, locale: ptBR })
                : "";

              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                    hasUnread
                      ? "bg-primary/5 border border-primary/20"
                      : "bg-card/30 border border-foreground/5 hover:bg-card/60"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {conv.other_user.avatar_url ? (
                      <img
                        src={conv.other_user.avatar_url}
                        alt={conv.other_user.display_name || ""}
                        className="h-14 w-14 rounded-full object-cover border-2 border-foreground/10"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-card border-2 border-foreground/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-foreground/30">
                          {(conv.other_user.display_name || "?")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Item thumbnail overlay */}
                    {conv.other_item.image_url && (
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-background overflow-hidden">
                        <img src={conv.other_item.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-sm truncate ${hasUnread ? "text-foreground" : "text-foreground/80"}`}>
                        {conv.other_user.display_name || "Usuário"}
                      </span>
                      {timeAgo && (
                        <span className={`text-[10px] shrink-0 ml-2 ${hasUnread ? "text-primary font-bold" : "text-foreground/40"}`}>
                          {timeAgo}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate max-w-[200px] ${hasUnread ? "text-foreground/90 font-medium" : "text-foreground/40"}`}>
                        {lastMsg
                          ? `${isMyLastMsg ? "Você: " : ""}${lastMsg.content}`
                          : `Troca: ${conv.my_item.name} ↔ ${conv.other_item.name}`}
                      </p>
                      {hasUnread && (
                        <span className="shrink-0 ml-2 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-foreground/30 mt-1 truncate">
                      {conv.my_item.name} ↔ {conv.other_item.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav activeTab="chat" />
    </ScreenLayout>
  );
};

export default Chat;
