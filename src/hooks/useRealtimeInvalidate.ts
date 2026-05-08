import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Subscription = {
  table: string;
  /** Postgres-style filter, e.g. `user_id=eq.${uid}`. Optional. */
  filter?: string;
  /** Query keys to invalidate when any change happens. */
  invalidateKeys: (string | (string | undefined | null)[])[];
  /** Listen to specific events. Defaults to all. */
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
};

/**
 * Subscribes to one or more Postgres tables and invalidates the given
 * React Query keys whenever a row changes. Cleans up on unmount.
 *
 * Usage:
 *   useRealtimeInvalidate([
 *     { table: "matches", invalidateKeys: [["matches", userId]] },
 *     { table: "ratings", filter: `rated_id=eq.${userId}`, invalidateKeys: [["ratings", userId]] },
 *   ], !!userId);
 */
export function useRealtimeInvalidate(subs: Subscription[], enabled = true) {
  const queryClient = useQueryClient();

  // Stable signature so we don't reconnect on every render.
  const sig = JSON.stringify(
    subs.map((s) => ({ t: s.table, f: s.filter ?? null, e: s.event ?? "*" }))
  );

  useEffect(() => {
    if (!enabled || subs.length === 0) return;

    const channelName = `rt-${sig.replace(/[^a-z0-9]/gi, "").slice(0, 40)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    let channel = supabase.channel(channelName);

    subs.forEach((s) => {
      channel = channel.on(
        "postgres_changes" as any,
        {
          event: s.event ?? "*",
          schema: "public",
          table: s.table,
          ...(s.filter ? { filter: s.filter } : {}),
        },
        () => {
          s.invalidateKeys.forEach((key) => {
            const queryKey = Array.isArray(key) ? key.filter(Boolean) : [key];
            queryClient.invalidateQueries({ queryKey });
          });
        }
      );
    });

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, enabled, queryClient]);
}
