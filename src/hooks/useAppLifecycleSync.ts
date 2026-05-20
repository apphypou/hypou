import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { forceReconnect } from "@/lib/realtimeManager";

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

  useEffect(() => {
    let lastSync = 0;
    const syncNow = () => {
      const now = Date.now();
      if (now - lastSync < 1500) return;
      lastSync = now;
      forceReconnect();
      queryClient.invalidateQueries();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") syncNow();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", syncNow);
    window.addEventListener("online", syncNow);

    let removeAppListener: (() => void) | null = null;
    if (Capacitor.isNativePlatform()) {
      import("@capacitor/app")
        .then(({ App }) => {
          const handle = App.addListener("appStateChange", (state) => {
            if (state.isActive) syncNow();
          });
          removeAppListener = () => {
            // handle pode ser Promise<PluginListenerHandle>
            Promise.resolve(handle).then((h) => h.remove()).catch(() => {});
          };
        })
        .catch(() => {});
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", syncNow);
      window.removeEventListener("online", syncNow);
      if (removeAppListener) removeAppListener();
    };
  }, [queryClient]);
}
