import { useEffect, useState } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useIncomingCalls } from "@/hooks/useIncomingCalls";
import { acceptCall, declineCall, joinCall } from "@/services/callService";
import { toast } from "@/hooks/use-toast";

/**
 * Global overlay that listens for incoming calls and renders an Apple-style
 * incoming-call sheet. Mounted once at the App root.
 */
export default function IncomingCallSheet() {
  const navigate = useNavigate();
  const { incoming, clear } = useIncomingCalls();
  const [busy, setBusy] = useState(false);

  // Optional ringtone (silent if asset missing)
  useEffect(() => {
    if (!incoming) return;
    const audio = new Audio("/ringtone.mp3");
    audio.loop = true;
    audio.volume = 0.6;
    audio.play().catch(() => {/* autoplay blocked */});
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [incoming?.id]);

  const onAccept = async () => {
    if (!incoming || busy) return;
    setBusy(true);
    try {
      await acceptCall(incoming.id);
      const tk = await joinCall(incoming.id);
      clear();
      navigate(`/chamada/${tk.room_name}`, {
        state: {
          token: tk.token,
          url: tk.url,
          callSessionId: tk.call_session_id,
          kind: tk.kind,
          conversationId: tk.conversation_id,
          isCaller: false,
        },
      });
    } catch (e: any) {
      toast({ title: "Não foi possível atender", description: e?.message ?? "Tente novamente", variant: "destructive" });
      clear();
    } finally {
      setBusy(false);
    }
  };

  const onDecline = async () => {
    if (!incoming || busy) return;
    setBusy(true);
    try {
      await declineCall(incoming.id);
    } catch {/* noop */}
    clear();
    setBusy(false);
  };

  return (
    <AnimatePresence>
      {incoming && (
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed inset-x-0 top-0 z-[100] px-4 pt-[max(env(safe-area-inset-top),1rem)]"
        >
          <div className="mx-auto max-w-md rounded-3xl bg-card/80 backdrop-blur-2xl border border-foreground/5 shadow-2xl px-4 py-3 flex items-center gap-3">
            {incoming.caller?.avatar_url ? (
              <img src={incoming.caller.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/60 font-bold">
                {(incoming.caller?.display_name || "?")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {incoming.caller?.display_name || "Usuário"}
              </p>
              <p className="text-xs text-foreground/60 flex items-center gap-1">
                {incoming.kind === "video" ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                Chamada {incoming.kind === "video" ? "de vídeo" : "de áudio"}…
              </p>
            </div>
            <button
              onClick={onDecline}
              disabled={busy}
              aria-label="Recusar"
              className="h-11 w-11 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center active:scale-95 transition disabled:opacity-50"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
            <button
              onClick={onAccept}
              disabled={busy}
              aria-label="Atender"
              className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition disabled:opacity-50"
            >
              <Phone className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
