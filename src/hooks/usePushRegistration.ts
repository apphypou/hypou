import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Registers the native device for push and stores the token in `device_tokens`.
 * No-op on web — we keep in-app realtime notifications there.
 *
 * Also handles taps on incoming notifications (foreground & background) and
 * navigates to the right screen via window.location (works from outside Router).
 */
export function usePushRegistration() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | null = null;

    (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        // Permission
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== "granted") return;

        const reg = await PushNotifications.addListener("registration", async (token) => {
          const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
          const { error } = await supabase
            .from("device_tokens")
            .upsert(
              { user_id: userId, token: token.value, platform },
              { onConflict: "token" },
            );

          if (error) {
            console.error("Push token storage failed", {
              code: error.code,
              message: error.message,
              platform,
            });
            return;
          }

          console.info("Push registration completed", { platform });
        });

        const err = await PushNotifications.addListener("registrationError", (e) => {
          console.error("Push registration error", e);
        });

        // Realtime remains the primary path, but iOS can deliver the native push
        // before its websocket event. Ask the call listener to re-query the
        // server immediately rather than waiting for its polling interval.
        const recv = await PushNotifications.addListener("pushNotificationReceived", (notification) => {
          const data: any = notification.data || {};
          if (data.type === "call" && data.call_session_id) {
            window.dispatchEvent(new CustomEvent("hypou:incoming-call-push"));
          }
        });

        // User tapped a notification → navigate
        const tap = await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const data: any = action.notification?.data || {};
          const type = data.type;
          if (type === "call" && data.conversation_id) {
            // Send to /chat — the IncomingCallSheet will handle the active session via realtime
            window.location.assign(`/chat/${data.conversation_id}`);
          } else if ((type === "message" || type === "missed_call") && data.conversation_id) {
            window.location.assign(`/chat/${data.conversation_id}`);
          } else if ((type === "match" || type === "proposal") && data.match_id) {
            window.location.assign(`/match/${data.match_id}`);
          } else {
            window.location.assign("/chat");
          }
        });

        // The native registration callback can fire immediately. Subscribe before
        // registering so the token is never lost on a fast iOS/Android response.
        await PushNotifications.register();

        cleanup = () => {
          reg.remove();
          err.remove();
          recv.remove();
          tap.remove();
        };
      } catch (e) {
        console.error("usePushRegistration failed", e);
      }
    })();

    return () => {
      cleanup?.();
    };
  }, [userId]);
}
