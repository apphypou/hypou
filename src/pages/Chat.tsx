import { MessageSquare, PhoneMissed } from "lucide-react";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import { useConversations } from "@/hooks/useMessages";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SkeletonConversation } from "@/components/SkeletonCard";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";

const Chat = () => {
  const { data: conversations = [], isLoading } = useConversations();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  return (
    <ScreenLayout>
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-3 pb-4 shrink-0">
        <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
          Chat
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/chamadas")}
            aria-label="Chamadas perdidas"
            className="h-9 w-9 rounded-full bg-card/60 backdrop-blur-xl border border-foreground/5 flex items-center justify-center active:scale-95 transition"
          >
            <PhoneMissed className="h-4 w-4 text-foreground/70" />
          </button>
          <div className="flex items-center gap-1">
            <span className="text-primary text-xs font-semibold">
              {conversations.filter((c) => c.unread_count > 0).length} nova{conversations.filter((c) => c.unread_count > 0).length !== 1 ? "s" : ""}
            </span>
            {conversations.some((c) => c.unread_count > 0) && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary neon-glow" />
            )}
          </div>
        </div>
      </header>

      <PullToRefresh onRefresh={handleRefresh} className="relative flex-1 w-full z-10 pb-28">
        <div className="px-5">
          {isLoading ? (
            <div className="flex flex-col gap-2 py-2">
              <SkeletonConversation />
              <SkeletonConversation />
              <SkeletonConversation />
            </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/8 border border-primary/10 flex items-center justify-center mb-5">
              <MessageSquare className="h-7 w-7 text-primary/60" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Comece uma conversa por uma troca</h2>
            <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground mb-6">
              Quando uma proposta for aceita, o chat abre aqui para combinar detalhes com segurança.
            </p>
            <button
              onClick={() => navigate("/explorar")}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold transition-all hover:opacity-90"
            >
              Explorar itens
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {(() => {
              const newHypes = conversations.filter((c) => !c.last_message);
              const withMessages = conversations.filter((c) => c.last_message);
              return (
                <>
                  {newHypes.length > 0 && (
                    <section>
                      <h2 className="text-foreground text-sm font-bold mb-3 px-1">Novos hypes</h2>
                      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                        {newHypes.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => navigate(`/chat/${conv.id}`)}
                            className="shrink-0 flex flex-col items-center gap-1.5 w-20"
                          >
                            <div className="relative">
                              {conv.other_item.image_url ? (
                                <img
                                  src={conv.other_item.image_url}
                                  alt={conv.other_item.name || ""}
                                  className="h-20 w-20 rounded-2xl object-cover border-2 border-primary/60 neon-glow"
                                />
                              ) : (
                                <div className="h-20 w-20 rounded-2xl bg-card border-2 border-primary/60 flex items-center justify-center">
                                  <span className="px-2 text-center text-[10px] font-bold leading-tight text-foreground/40">
                                    {conv.other_item.name || "Item"}
                                  </span>
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-2 border-background overflow-hidden bg-card flex items-center justify-center">
                                {conv.other_user.avatar_url ? (
                                  <img
                                    src={conv.other_user.avatar_url}
                                    alt={conv.other_user.display_name || ""}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] font-bold text-foreground/40">
                                    {(conv.other_user.display_name || "?")[0].toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-foreground/80 truncate w-full text-center">
                              {conv.other_user.display_name || "Usuário"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <h2 className="text-foreground text-sm font-bold mb-3 px-1">Mensagens</h2>
                    {withMessages.length === 0 ? (
                      <p className="text-foreground/40 text-xs px-1">
                        Mande a primeira mensagem para algum dos seus novos hypes.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {withMessages.map((conv) => {
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
                  {/* Avatar — clickable to user profile */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/usuario/${conv.other_user.user_id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/usuario/${conv.other_user.user_id}`);
                      }
                    }}
                    className="relative shrink-0"
                  >
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
                  </section>
                </>
              );
            })()}
          </div>
        )}
        </div>
      </PullToRefresh>

      <BottomNav activeTab="chat" />
    </ScreenLayout>
  );
};

export default Chat;
