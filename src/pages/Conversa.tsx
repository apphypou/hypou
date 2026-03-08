import { ArrowLeft, Send, Check, CheckCheck, Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useMessages, useSendMessage } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ChatSafetyDialog from "@/components/ChatSafetyDialog";

// Fetch conversation details
const useConversationDetails = (conversationId: string | null) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversation-detail", conversationId],
    queryFn: async () => {
      if (!conversationId || !user) return null;

      // Get conversation -> match -> items + other user
      const { data: conv } = await supabase
        .from("conversations")
        .select("id, match_id")
        .eq("id", conversationId)
        .single();

      if (!conv) return null;

      const { data: match } = await supabase
        .from("matches")
        .select(`
          id, user_a_id, user_b_id,
          item_a:item_a_id (name, item_images (image_url, position)),
          item_b:item_b_id (name, item_images (image_url, position))
        `)
        .eq("id", conv.match_id)
        .single();

      if (!match) return null;

      const isUserA = match.user_a_id === user.id;
      const otherUserId = isUserA ? match.user_b_id : match.user_a_id;
      const otherItem = isUserA ? match.item_b : match.item_a;
      const myItem = isUserA ? match.item_a : match.item_b;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", otherUserId)
        .single();

      return {
        other_user_id: otherUserId,
        other_user: profile || { display_name: "Usuário", avatar_url: null },
        other_item: otherItem as any,
        my_item: myItem as any,
      };
    },
    enabled: !!conversationId && !!user,
  });
};

const Conversa = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data: messages = [], isLoading } = useMessages(conversationId || null);
  const { data: details } = useConversationDetails(conversationId || null);
  const { mutate: send, isPending: sending } = useSendMessage(conversationId || null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if user accepted chat terms
  const { data: chatTermsAccepted } = useQuery({
    queryKey: ["chat-terms", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("chat_terms_accepted_at")
        .eq("user_id", user!.id)
        .single();
      return !!(data as any)?.chat_terms_accepted_at;
    },
    enabled: !!user,
  });

  const showSafetyDialog = chatTermsAccepted === false;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    send(trimmed);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground font-display overflow-hidden">
      {/* Safety Dialog */}
      {user && (
        <ChatSafetyDialog
          open={showSafetyDialog}
          userId={user.id}
          onAccepted={() => queryClient.setQueryData(["chat-terms", user.id], true)}
        />
      )}
      {/* Header */}
      <header className="relative z-40 flex items-center gap-3 px-4 pt-4 pb-3 border-b border-foreground/5 bg-background/80 backdrop-blur-xl shrink-0">
        <button
          onClick={() => navigate("/chat")}
          className="h-10 w-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {details && (
          <button
            onClick={() => navigate(`/usuario/${details.other_user_id}`)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
          >
            {details.other_user.avatar_url ? (
              <img
                src={details.other_user.avatar_url}
                alt=""
                className="h-10 w-10 rounded-full object-cover border border-foreground/10"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-card border border-foreground/10 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground/30">
                  {(details.other_user.display_name || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground truncate">
                {details.other_user.display_name || "Usuário"}
              </p>
              <p className="text-[10px] text-foreground/40 truncate">
                {details.my_item?.name} ↔ {details.other_item?.name}
              </p>
            </div>
          </button>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
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
            const isMine = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-foreground/5 text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                    <span className={`text-[10px] ${isMine ? "text-primary-foreground/60" : "text-foreground/30"}`}>
                      {formatTime(msg.created_at)}
                    </span>
                    {isMine && (
                      msg.read_at ? (
                        <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                      ) : (
                        <Check className="h-3 w-3 text-primary-foreground/40" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-8 pt-3 border-t border-foreground/5 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="w-full bg-card/50 border border-foreground/10 text-foreground rounded-2xl px-4 py-3 pr-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20 resize-none text-sm max-h-32"
              style={{ minHeight: "44px" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="h-11 w-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:active:scale-100 neon-glow"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Conversa;
