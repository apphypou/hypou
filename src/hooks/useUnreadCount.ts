import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadCount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unread-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Get all conversation IDs for this user
      const { data: matches } = await supabase
        .from("matches")
        .select("conversations (id)")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

      if (!matches) return 0;

      const convIds = matches
        .map((m: any) => {
          const conv = Array.isArray(m.conversations) ? m.conversations[0] : m.conversations;
          return conv?.id;
        })
        .filter(Boolean);

      if (convIds.length === 0) return 0;

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .neq("sender_id", user.id)
        .is("read_at", null);

      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Subscribe to new messages for real-time badge updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if ((payload.new as any).sender_id !== user.id) {
            queryClient.invalidateQueries({ queryKey: ["unread-count"] });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query.data || 0;
};
