import { Archive, ArchiveRestore, CheckSquare, MessageSquare, PhoneMissed, Square } from "lucide-react";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import { useArchiveConversations, useConversations, useUnarchiveConversation } from "@/hooks/useMessages";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SkeletonConversation } from "@/components/SkeletonCard";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isNewHype } from "@/lib/conversationHype";
import { getErrorMessage } from "@/lib/utils";

const Chat = () => {
  const [showArchived, setShowArchived] = useState(false);
  const [selectingConversations, setSelectingConversations] = useState(false);
  const [selectedConversationIds, setSelectedConversationIds] = useState<Set<string>>(new Set());
  const { data: conversations = [], isLoading } = useConversations(showArchived ? "archived" : "main");
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const archiveManyMutation = useArchiveConversations();
  const unarchiveMutation = useUnarchiveConversation();
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedConversationIdRef = useRef<string | null>(null);
  const selectedCount = selectedConversationIds.size;
  const unreadConversationCount = conversations.filter((conversation) => conversation.unread_count > 0).length;

  useEffect(() => () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  }, []);

  const resetSelection = () => {
    setSelectingConversations(false);
    setSelectedConversationIds(new Set());
    longPressedConversationIdRef.current = null;
  };

  const toggleConversationSelection = (conversationId: string) => {
    setSelectedConversationIds((current) => {
      const next = new Set(current);
      if (next.has(conversationId)) next.delete(conversationId);
      else next.add(conversationId);
      return next;
    });
  };

  const clearLongPress = () => {
    if (!longPressTimerRef.current) return;
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const startConversationLongPress = (conversationId: string) => {
    if (showArchived || selectingConversations) return;

    clearLongPress();
    longPressTimerRef.current = setTimeout(() => {
      longPressedConversationIdRef.current = conversationId;
      setSelectingConversations(true);
      setSelectedConversationIds(new Set([conversationId]));
      longPressTimerRef.current = null;
    }, 450);
  };

  const handleConversationClick = (conversationId: string) => {
    if (longPressedConversationIdRef.current === conversationId) {
      longPressedConversationIdRef.current = null;
      return;
    }

    if (selectingConversations) toggleConversationSelection(conversationId);
    else navigate(`/chat/${conversationId}`);
  };

  const handleRefresh = async () => {
    await queryClient.refetchQueries({ queryKey: ["conversations"], type: "active" });
  };

  const handleRestoreConversation = async (conversationId: string) => {
    try {
      await unarchiveMutation.mutateAsync(conversationId);
      toast({ title: "Conversa desarquivada" });
    } catch (error: unknown) {
      toast({
        title: "Erro ao desarquivar",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleArchiveSelected = async () => {
    if (selectedConversationIds.size === 0) return;

    try {
      await archiveManyMutation.mutateAsync([...selectedConversationIds]);
      toast({ title: `${selectedConversationIds.size} conversa${selectedConversationIds.size === 1 ? "" : "s"} arquivada${selectedConversationIds.size === 1 ? "" : "s"}` });
      resetSelection();
    } catch (error: unknown) {
      toast({
        title: "Erro ao arquivar conversas",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <ScreenLayout onRefresh={handleRefresh}>
      <header className="relative z-40 flex w-full items-start justify-between px-5 pt-3 pb-4 shrink-0">
        <div>
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight">Chat</h1>
          <p className="mt-1 text-sm text-foreground/50">
            {showArchived
              ? "Conversas guardadas"
              : unreadConversationCount > 0
                ? `${unreadConversationCount} conversa${unreadConversationCount === 1 ? "" : "s"} não lida${unreadConversationCount === 1 ? "" : "s"}`
                : "Suas conversas de troca"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/chamadas")}
            aria-label="Chamadas perdidas"
            className="grid h-10 w-10 place-items-center rounded-full border border-foreground/10 bg-card/60 text-foreground/70 backdrop-blur-xl transition active:scale-95"
          >
            <PhoneMissed className="h-4 w-4 text-foreground/70" />
          </button>
          <button
            type="button"
            onClick={() => {
              resetSelection();
              setShowArchived((value) => !value);
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-foreground/10 bg-card/60 px-3 text-xs font-bold text-foreground/75 backdrop-blur-xl transition active:scale-95"
          >
            {showArchived ? <MessageSquare className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            {showArchived ? "Mensagens" : "Arquivadas"}
          </button>
        </div>
      </header>

      <div className="relative flex-1 w-full z-10 pb-28 overflow-y-auto no-scrollbar">
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
            <h2 className="text-xl font-bold text-foreground">
              {showArchived ? "Nenhuma conversa arquivada" : "Comece uma conversa por uma troca"}
            </h2>
            <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground mb-6">
              {showArchived
                ? "As conversas que você arquivar aparecerão aqui."
                : "Quando uma proposta for aceita, o chat abre aqui para combinar detalhes com segurança."}
            </p>
            <button
              onClick={() => {
                if (showArchived) {
                  resetSelection();
                  setShowArchived(false);
                  return;
                }

                navigate("/explorar");
              }}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold transition-all hover:opacity-90"
            >
              {showArchived ? "Voltar para mensagens" : "Explorar itens"}
            </button>
            {!showArchived && (
              <button
                type="button"
                onClick={() => {
                  resetSelection();
                  setShowArchived(true);
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-card/60 px-4 py-2 text-xs font-bold text-foreground/70 active:scale-95"
              >
                <Archive className="h-3.5 w-3.5" />
                Ver arquivadas
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {(() => {
              // A completed trade can remain chatable, but it is no longer a new hype.
              const newHypes = conversations.filter(isNewHype);
              const withMessages = showArchived
                ? conversations
                : conversations.filter((c) => c.last_message || c.match_status === "completed");
              const selectableConversationIds = withMessages.map((conversation) => conversation.id);
              const allVisibleSelected = selectableConversationIds.length > 0 && selectableConversationIds.every((id) => selectedConversationIds.has(id));
              return (
                <>
                  {!showArchived && newHypes.length > 0 && (
                    <section>
                      <h2 className="text-foreground text-sm font-bold mb-3 px-1">Novos hypes</h2>
                      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                        {newHypes.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => navigate(`/chat/${conv.id}`)}
                            className="shrink-0 flex flex-col items-center gap-1.5 w-20"
                          >
                            <div>
                              {conv.other_item.image_url ? (
                                <img
                                  src={conv.other_item.image_url}
                                  alt={conv.other_item.name || ""}
                                  className="h-20 w-20 rounded-2xl object-cover border border-pink/50 shadow-[0_0_18px_hsl(var(--pink)/0.18)]"
                                />
                              ) : (
                                <div className="h-20 w-20 rounded-2xl border border-pink/50 bg-card flex items-center justify-center">
                                  <span className="px-2 text-center text-xs font-bold leading-tight text-foreground/40">
                                    {conv.other_item.name || "Item"}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-foreground/80 truncate w-full text-center">
                              {conv.other_user.display_name || "Usuário"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <div className="mb-3 flex items-center justify-between px-1">
                      <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/50">
                        {showArchived ? "Arquivadas" : "Conversas"}
                      </h2>
                      <span className="text-xs font-semibold tabular-nums text-foreground/40">{withMessages.length}</span>
                    </div>
                    {selectingConversations && !showArchived && withMessages.length > 0 && (
                      <div className="mb-3 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedConversationIds(allVisibleSelected ? new Set() : new Set(selectableConversationIds))}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground/80"
                          >
                            {allVisibleSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-foreground/50" />}
                            {allVisibleSelected ? "Limpar seleção" : "Selecionar todas"}
                          </button>
                          <button
                            type="button"
                            onClick={resetSelection}
                            className="text-xs font-bold text-foreground/55"
                          >
                            Cancelar
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleArchiveSelected}
                          disabled={selectedCount === 0 || archiveManyMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          Arquivar ({selectedCount})
                        </button>
                      </div>
                    )}
                    {withMessages.length === 0 ? (
                      <p className="text-foreground/40 text-xs px-1">
                        {showArchived
                          ? "Nenhuma conversa arquivada."
                          : "Mande a primeira mensagem para algum dos seus novos hypes."}
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
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleConversationClick(conv.id)}
                  onPointerDown={(event) => {
                    if (event.pointerType !== "mouse" || event.button === 0) startConversationLongPress(conv.id);
                  }}
                  onPointerUp={clearLongPress}
                  onPointerCancel={clearLongPress}
                  onPointerLeave={clearLongPress}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleConversationClick(conv.id);
                    }
                  }}
                  aria-label={selectingConversations
                    ? `Selecionar conversa com ${conv.other_user.display_name || "usuário"}`
                    : `Abrir conversa com ${conv.other_user.display_name || "usuário"}. Pressione e segure para selecionar.`}
                  className={`w-full touch-manipulation select-none flex items-center gap-3 rounded-[1.35rem] p-3.5 text-left transition-all ${
                    selectingConversations && selectedConversationIds.has(conv.id)
                      ? "border border-primary/60 bg-primary/10"
                      : hasUnread
                      ? "border border-foreground/15 bg-card/75 shadow-[0_8px_20px_hsl(var(--background)/0.12)]"
                      : "border border-foreground/8 bg-card/35 hover:bg-card/55"
                  }`}
                >
                  {!selectingConversations && <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/usuario/${conv.other_user.user_id}`);
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/usuario/${conv.other_user.user_id}`);
                      }
                    }}
                    className="shrink-0"
                  >
                    {conv.other_item.image_url ? (
                      <img
                        src={conv.other_item.image_url}
                        alt={conv.other_item.name || ""}
                        className="h-14 w-14 rounded-xl border border-foreground/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-foreground/10 bg-card">
                        <span className="px-2 text-center text-xs font-bold leading-tight text-foreground/40">
                          {conv.other_item.name || "Item"}
                        </span>
                      </div>
                    )}
                  </div>}

                  {selectingConversations && (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-primary/60 bg-background/70">
                      {selectedConversationIds.has(conv.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-foreground/45" />}
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={`truncate text-[15px] font-bold ${hasUnread ? "text-foreground" : "text-foreground/85"}`}>
                        {conv.other_user.display_name || "Usuário"}
                      </span>
                      {timeAgo && (
                        <span className={`shrink-0 text-[11px] ${hasUnread ? "font-bold text-pink" : "text-foreground/40"}`}>
                          {timeAgo}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <p className={`min-w-0 flex-1 truncate text-[13px] ${hasUnread ? "font-medium text-foreground/85" : "text-foreground/50"}`}>
                        {lastMsg
                          ? `${isMyLastMsg ? "Você: " : ""}${lastMsg.content}`
                          : `Troca: ${conv.my_item.name} ↔ ${conv.other_item.name}`}
                      </p>
                      {hasUnread && (
                        <span className="flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-pink px-1.5 text-[11px] font-bold text-pink-foreground">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 truncate text-[11px] text-foreground/40">
                      {conv.my_item.name} ↔ {conv.other_item.name}
                    </p>
                  </div>
                  {showArchived && !selectingConversations && <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestoreConversation(conv.id);
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    disabled={unarchiveMutation.isPending}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-foreground/10 bg-background/45 text-foreground/65 active:scale-95 disabled:opacity-50"
                    aria-label="Desarquivar conversa"
                  >
                    <ArchiveRestore className="h-4 w-4" />
                  </button>}
                </div>
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
      </div>

      <BottomNav activeTab="chat" />
    </ScreenLayout>
  );
};

export default Chat;
