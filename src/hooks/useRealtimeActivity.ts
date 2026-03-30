import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityEvent {
  id: string;
  type: "user" | "item" | "match" | "message";
  description: string;
  timestamp: string;
}

export function useRealtimeActivity(maxEvents = 20) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-activity")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload) => {
          addEvent({
            type: "user",
            description: `Novo usuário: ${payload.new.display_name || "Anônimo"}`,
            timestamp: payload.new.created_at,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "items" },
        (payload) => {
          addEvent({
            type: "item",
            description: `Novo item: ${payload.new.name}`,
            timestamp: payload.new.created_at,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        (payload) => {
          addEvent({
            type: "match",
            description: `Novo match criado`,
            timestamp: payload.new.created_at,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          addEvent({
            type: "message",
            description: "Nova mensagem enviada",
            timestamp: new Date().toISOString(),
          });
        }
      )
      .subscribe();

    function addEvent(event: Omit<ActivityEvent, "id">) {
      setEvents((prev) => [
        { ...event, id: crypto.randomUUID() },
        ...prev.slice(0, maxEvents - 1),
      ]);
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [maxEvents]);

  return events;
}
