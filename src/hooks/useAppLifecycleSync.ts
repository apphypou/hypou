import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { forceReconnect } from "@/lib/realtimeManager";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const PRESENCE_HEARTBEAT_MS = 15_000;

/**
 * Garante que sempre que o app volta do background (visibilitychange, focus,
 * online ou Capacitor appStateChange) nós:
 *  1. Reconectamos o WebSocket Realtime
 *  2. Invalidamos todas as queries ativas (refetch sem reload)
 *
 * Montado uma única vez perto da raiz (em <GlobalAlerts/>).
 */
export function useAppLifecycleSync() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    let lastSync = 0;
    let heartbeat: number | null = null;

    const setPresence = (active: boolean) => {
      if (!userId) return;
      void supabase.rpc("set_app_presence" as any, { p_active: active });
    };

    const stopHeartbeat = () => {
      if (heartbeat !== null) window.clearInterval(heartbeat);
      heartbeat = null;
    };

    const startHeartbeat = () => {
      if (!userId) return;
      stopHeartbeat();
      setPresence(true);
      heartbeat = window.setInterval(() => setPresence(true), PRESENCE_HEARTBEAT_MS);
    };

    const syncNow = () => {
      const now = Date.now();
      if (now - lastSync < 1500) return;
      lastSync = now;
      forceReconnect();
      queryClient.invalidateQueries();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        syncNow();
        startHeartbeat();
      } else {
        stopHeartbeat();
        setPresence(false);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", syncNow);
    window.addEventListener("online", syncNow);

    let removeAppListener: (() => void) | null = null;
    if (Capacitor.isNativePlatform()) {
      import("@capacitor/app")
        .then(({ App }) => {
          const handle = App.addListener("appStateChange", (state) => {
            if (state.isActive) {
              syncNow();
              startHeartbeat();
            } else {
              stopHeartbeat();
              setPresence(false);
            }
          });
          removeAppListener = () => {
            // handle pode ser Promise<PluginListenerHandle>
            Promise.resolve(handle).then((h) => h.remove()).catch(() => {});
          };
        })
        .catch(() => {});
    }

    if (document.visibilityState === "visible") startHeartbeat();

    return () => {
      stopHeartbeat();
      setPresence(false);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", syncNow);
      window.removeEventListener("online", syncNow);
      if (removeAppListener) removeAppListener();
    };
  }, [queryClient, userId]);
}
