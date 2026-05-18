import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Video, PhoneMissed, PhoneOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import ScreenLayout from "@/components/ScreenLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { startCall, joinCall } from "@/services/callService";
import { toast } from "@/hooks/use-toast";

interface MissedCall {
  id: string;
  conversation_id: string;
  caller_id: string;
  callee_id: string;
  kind: "video" | "audio";
  status: string;
  started_at: string;
  other_user?: { display_name: string | null; avatar_url: string | null };
}

export default function ChamadasPerdidas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<MissedCall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("call_sessions")
        .select("*")
        .eq("callee_id", user.id)
        .in("status", ["missed", "declined"])
        .order("started_at", { ascending: false })
        .limit(50);

      const calls = (data || []) as any[];
      const callerIds = Array.from(new Set(calls.map((c) => c.caller_id)));
      const { data: profiles } = await supabase
        .from("public_profiles" as any)
        .select("user_id, display_name, avatar_url")
        .in("user_id", callerIds);
      const map = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      setItems(calls.map((c) => ({ ...c, other_user: map.get(c.caller_id) })));
      setLoading(false);
    })();
  }, [user?.id]);

  const callBack = async (mc: MissedCall) => {
    try {
      const tk = await startCall(mc.conversation_id, mc.kind);
      navigate(`/chamada/${tk.room_name}`, {
        state: {
          token: tk.token,
          url: tk.url,
          callSessionId: tk.call_session_id,
          kind: tk.kind,
          conversationId: tk.conversation_id,
          isCaller: true,
        },
      });
    } catch (e: any) {
      toast({ title: "Não foi possível ligar", description: e?.message ?? "Tente novamente", variant: "destructive" });
    }
  };

  return (
    <ScreenLayout>
      <header className="relative z-40 flex items-center gap-3 px-5 pt-3 pb-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="h-10 w-10 rounded-full bg-card/60 backdrop-blur-xl border border-foreground/5 flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-foreground text-2xl font-extrabold tracking-tight">Chamadas</h1>
      </header>

      <div className="flex-1 px-5 pb-28 overflow-y-auto">
        {loading ? (
          <p className="text-foreground/40 text-sm text-center mt-10">Carregando…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="h-20 w-20 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4">
              <PhoneMissed className="h-10 w-10 text-foreground/30" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Nenhuma chamada perdida</h2>
            <p className="text-foreground/50 text-sm max-w-xs leading-relaxed">
              Quando alguém te ligar e você não atender, aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((mc) => {
              const Icon = mc.kind === "video" ? Video : Phone;
              const isDeclined = mc.status === "declined";
              return (
                <div
                  key={mc.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-card/30 border border-foreground/5"
                >
                  {mc.other_user?.avatar_url ? (
                    <img src={mc.other_user.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-foreground/10 flex items-center justify-center font-bold text-foreground/60">
                      {(mc.other_user?.display_name || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {mc.other_user?.display_name || "Usuário"}
                    </p>
                    <p className="text-xs text-destructive flex items-center gap-1.5">
                      {isDeclined ? <PhoneOff className="h-3 w-3" /> : <PhoneMissed className="h-3 w-3" />}
                      <Icon className="h-3 w-3" />
                      {isDeclined ? "Recusada" : "Perdida"} ·{" "}
                      {formatDistanceToNow(new Date(mc.started_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <button
                    onClick={() => callBack(mc)}
                    aria-label="Ligar de volta"
                    className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ScreenLayout>
  );
}
