import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Mounts global realtime listeners that surface in-app toasts for new
 * notifications, proposals (matches) and chat messages — without requiring
 * a page reload. Should be mounted once near the root, inside AuthProvider.
 */
export function useGlobalRealtimeAlerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mountedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!user) return;
    mountedAt.current = Date.now();

    const channel = supabase
      .channel(`global-alerts-${user.id}`)
      // New notifications addressed to this user
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const n = payload.new;
          if (!n) return;
          // Skip events that happened before this session mounted
          if (n.created_at && new Date(n.created_at).getTime() < mountedAt.current - 5000) return;
          toast(n.title || "Nova notificação", {
            description: n.body || undefined,
            action: {
              label: "Ver",
              onClick: () => {
                if (n.type === "proposal" || n.type === "trade_confirmed") {
                  navigate("/partidas");
                } else {
                  navigate("/partidas");
                }
              },
            },
          });
        }
      )
      // New proposals received (someone proposed to my item -> I'm user_b)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `user_b_id=eq.${user.id}`,
        },
        (payload: any) => {
          const m = payload.new;
          if (!m || m.status !== "proposal") return;
          if (m.created_at && new Date(m.created_at).getTime() < mountedAt.current - 5000) return;
          toast("Nova proposta recebida! 🔔", {
            description: "Alguém quer trocar com você.",
            action: {
              label: "Abrir",
              onClick: () => navigate("/partidas"),
            },
          });
        }
      )
      // New messages (we filter sender on client)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload: any) => {
          const msg = payload.new;
          if (!msg || msg.sender_id === user.id) return;
          if (msg.message_type === "system") return;
          if (msg.created_at && new Date(msg.created_at).getTime() < mountedAt.current - 5000) return;

          // Confirm this conversation belongs to me before alerting
          const { data: conv } = await supabase
            .from("conversations")
            .select("id, match:matches!inner(user_a_id, user_b_id)")
            .eq("id", msg.conversation_id)
            .maybeSingle();
          const match: any = (conv as any)?.match;
          if (!match) return;
          if (match.user_a_id !== user.id && match.user_b_id !== user.id) return;

          // Avoid alerting if user is already in that conversation
          if (window.location.pathname.includes(`/conversa/${msg.conversation_id}`)) return;

          const preview =
            msg.message_type === "text"
              ? (msg.content || "").slice(0, 80)
              : msg.message_type === "image"
              ? "📷 Imagem"
              : msg.message_type === "video"
              ? "🎬 Vídeo"
              : msg.message_type === "audio"
              ? "🎤 Áudio"
              : "Nova mensagem";

          toast("Nova mensagem 💬", {
            description: preview,
            action: {
              label: "Abrir",
              onClick: () => navigate(`/conversa/${msg.conversation_id}`),
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);
}
