import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePendingTradeConfirmations } from "@/hooks/usePendingTradeConfirmations";
import { confirmTrade } from "@/services/matchService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";

const hiddenOnRoutes = [
  "/",
  "/login",
  "/cadastro",
  "/confirmar-codigo",
  "/recuperar-senha",
  "/reset-password",
  "/onboarding",
  "/termos",
  "/privacidade",
];

export default function PendingTradeConfirmationDialog() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data = [] } = usePendingTradeConfirmations();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const shouldHide = hiddenOnRoutes.some((path) => location.pathname === path);
  const match = useMemo(
    () => data.find((item) => !dismissedIds.has(item.id)),
    [data, dismissedIds],
  );

  if (shouldHide || !user || !match) return null;

  const dismiss = () => {
    setDismissedIds((current) => new Set(current).add(match.id));
  };

  const finishTrade = async () => {
    setConfirmingId(match.id);
    try {
      await confirmTrade(match.id, user.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["matches"] }),
        queryClient.invalidateQueries({ queryKey: ["pending-trade-confirmations"] }),
        queryClient.invalidateQueries({ queryKey: ["conversations"] }),
      ]);
      toast({ title: "Troca finalizada", description: "A confirmação foi registrada." });
      dismiss();
    } catch (err: any) {
      toast({
        title: "Erro ao confirmar troca",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end bg-black/55 p-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
      <div className="w-full rounded-[28px] border border-white/10 bg-[#171717]/95 p-5 shadow-2xl backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Finalizar troca
        </p>
        <h2 className="mt-2 text-2xl font-bold text-foreground">A outra pessoa confirmou a entrega</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Confirme se a troca também foi concluída do seu lado.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={finishTrade}
            disabled={confirmingId === match.id}
            className="rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-60"
          >
            <CheckCircle2 className="mr-2 inline h-5 w-5" />
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => {
              dismiss();
              navigate("/partidas");
            }}
            className="rounded-full border border-white/10 py-3 font-bold text-foreground"
          >
            <MessageCircle className="mr-2 inline h-5 w-5" />
            Ver troca
          </button>
        </div>
        <button type="button" onClick={dismiss} className="mt-4 w-full py-2 text-sm font-semibold text-muted-foreground">
          Agora não
        </button>
      </div>
    </div>
  );
}
