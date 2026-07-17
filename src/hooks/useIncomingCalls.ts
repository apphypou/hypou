import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface IncomingCall {
  id: string;
  conversation_id: string;
  caller_id: string;
  callee_id: string;
  kind: "video" | "audio";
  room_name: string;
  status: string;
  caller?: { display_name: string | null; avatar_url: string | null };
}

/**
 * Subscribes to call_sessions where this user is the callee and status='ringing'.
 * Returns the most recent incoming ringing call (or null) plus a clear() helper
 * that the UI calls after accept/decline so the local state matches reality even
 * before realtime catches up.
 */
export function useIncomingCalls() {
  const { user } = useAuth();
  const userId = user?.id;
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from("public_profiles" as any)
        .select("display_name, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();
      return (data as any) ?? null;
    };

    const setWithProfile = async (row: any) => {
      const caller = await fetchProfile(row.caller_id);
      if (cancelled) return;
      setIncoming({ ...row, caller });
    };

    const loadLatestRinging = async () => {
      const { data, error } = await supabase
        .from("call_sessions")
        .select("*")
        .eq("callee_id", userId)
        .eq("status", "ringing")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn("[call] incoming-call-refresh-failed", {
          code: error.code,
          message: error.message,
        });
        return;
      }
      if (data) {
        await setWithProfile(data);
      } else {
        setIncoming((cur) => (cur?.status === "ringing" ? null : cur));
      }
    };

    // Realtime is the fast path; polling covers iOS foreground sessions where
    // the websocket event can be missed while both users stay on chat screens.
    void loadLatestRinging();
    const pollTimer = window.setInterval(loadLatestRinging, 3000);
    const onIncomingCallPush = () => {
      void loadLatestRinging();
    };
    window.addEventListener("hypou:incoming-call-push", onIncomingCallPush);

    const channel = supabase
      .channel(`incoming-calls-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_sessions", filter: `callee_id=eq.${userId}` },
        (payload) => {
          const row: any = payload.new;
          if (row.status === "ringing") setWithProfile(row);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "call_sessions", filter: `callee_id=eq.${userId}` },
        (payload) => {
          const row: any = payload.new;
          // If the active incoming call moved to non-ringing, clear it
          setIncoming((cur) => {
            if (cur && cur.id === row.id && row.status !== "ringing") return null;
            return cur;
          });
        },
      )
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[call] incoming-call-realtime-unavailable", {
            status,
            message: error?.message,
          });
        }
      });

    return () => {
      cancelled = true;
      window.clearInterval(pollTimer);
      window.removeEventListener("hypou:incoming-call-push", onIncomingCallPush);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { incoming, clear: () => setIncoming(null) };
}
