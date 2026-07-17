import { Archive, ArchiveRestore, CheckSquare, MessageSquare, PhoneMissed, Square } from "lucide-react";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import { useArchiveConversation, useArchiveConversations, useConversations, useUnarchiveConversation } from "@/hooks/useMessages";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SkeletonConversation } from "@/components/SkeletonCard";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isNewHype } from "@/lib/conversationHype";

const Chat = () => {
  const [showArchived, setShowArchived] = useState(false);
  const [selectingConversations, setSelectingConversations] = useState(false);
  const [selectedConversationIds, setSelectedConversationIds] = useState<Set<string>>(new Set());
  const { data: conversations = [], isLoading } = useConversations(showArchived ? "archived" : "main");
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const archiveMutation = useArchiveConversation();
  const archiveManyMutation = useArchiveConversations();
  const unarchiveMutation = useUnarchiveConversation();
  const selectedCount = selectedConversationIds.size;

  const resetSelection = () => {
    setSelectingConversations(false);
    setSelectedConversationIds(new Set());
  };

  const toggleConversationSelection = (conversationId: string) => {
    setSelectedConversationIds((current) => {
      const next = new Set(current);
      if (next.has(conversationId)) next.delete(conversationId);
      else next.add(conversationId);
      return next;
    });
  };

  const handleRefresh = async () => {
    await queryClient.refetchQueries({ queryKey: ["conversations"], type: "active" });
  };

  const handleArchiveToggle = async (conversationId: string) => {
    try {
      if (showArchived) {
        await unarchiveMutation.mutateAsync(conversationId);
        toast({ title: "Conversa desarquivada" });
      } else {
        await archiveMutation.mutateAsync(conversationId);
        toast({ title: "Conversa arquivada" });
      }
    } catch (err: any) {
      toast({
        title: showArchived ? "Erro ao desarquivar" : "Erro ao arquivar",
        description: err?.message || "Tente novamente.",
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
    } catch (err: any) {
      toast({
        title: "Erro ao arquivar conversas",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <ScreenLayout onRefresh={handleRefresh}>
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-3 pb-4 shrink-0">
        <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
          Chat
        </h1>
        <div className="flex items-center gap-3">
          {!showArchived && (
            <button
              type="button"
              onClick={() => selectingConversations ? resetSelection() : setSelectingConversations(true)}
              className="h-9 rounded-full border border-foreground/10 bg-card/60 px-3 text-[11px] font-bold text-foreground/75 active:scale-95"
            >
              {selectingConversations ? "Cancelar" : "Selecionar"}
            </button>
          )}
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
                    <div className="mb-3 flex items-center justify-between gap-3 px-1">
                      <h2 className="text-foreground text-sm font-bold">
                        {showArchived ? "Arquivadas" : "Mensagens"}
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          resetSelection();
                          setShowArchived((value) => !value);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-card/60 px-3 py-1.5 text-[11px] font-bold text-foreground/70 active:scale-95"
                      >
                        {showArchived ? (
                          <>
                            <MessageSquare className="h-3.5 w-3.5" />
                            Mensagens
                          </>
                        ) : (
                          <>
                            <Archive className="h-3.5 w-3.5" />
                            Arquivadas
                          </>
                        )}
                      </button>
                    </div>
                    {selectingConversations && !showArchived && withMessages.length > 0 && (
                      <div className="mb-3 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2">
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
                  onClick={() => selectingConversations ? toggleConversationSelection(conv.id) : navigate(`/chat/${conv.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (selectingConversations) toggleConversationSelection(conv.id);
                      else navigate(`/chat/${conv.id}`);
                    }
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                    selectingConversations && selectedConversationIds.has(conv.id)
                      ? "bg-primary/10 border border-primary/60"
                      : hasUnread
                      ? "bg-primary/5 border border-primary/20"
                      : "bg-card/30 border border-foreground/5 hover:bg-card/60"
                  }`}
                >
                  {/* Produto principal + avatar menor */}
                  {!selectingConversations && <div
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
                    {conv.other_item.image_url ? (
                      <img
                        src={conv.other_item.image_url}
                        alt={conv.other_item.name || ""}
                        className="h-16 w-16 rounded-2xl object-cover border border-foreground/10"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-card border border-foreground/10 flex items-center justify-center">
                        <span className="px-2 text-center text-[10px] font-bold leading-tight text-foreground/40">
                          {conv.other_item.name || "Item"}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-2 border-background overflow-hidden bg-card flex items-center justify-center">
                      {conv.other_user.avatar_url ? (
                        <img src={conv.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-foreground/40">
                          {(conv.other_user.display_name || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>}

                  {selectingConversations && (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-primary/60 bg-background/70">
                      {selectedConversationIds.has(conv.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-foreground/45" />}
                    </span>
                  )}

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
                      <p className={`text-xs truncate max-w-[160px] ${hasUnread ? "text-foreground/90 font-medium" : "text-foreground/40"}`}>
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
                  {!selectingConversations && <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchiveToggle(conv.id);
                    }}
                    disabled={archiveMutation.isPending || unarchiveMutation.isPending}
                    className="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-foreground/10 bg-background/50 text-foreground/65 active:scale-95 disabled:opacity-50"
                    aria-label={showArchived ? "Desarquivar conversa" : "Arquivar conversa"}
                  >
                    {showArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
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
