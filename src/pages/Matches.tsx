import { MessageSquare, Loader2, MapPin, Tag, Star, ArrowRightLeft, Handshake, X as XIcon, Repeat2, ArrowLeft, Clock, Send } from "lucide-react";
import { useMemo } from "react";
import { SkeletonMatchCard } from "@/components/SkeletonCard";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import GlassCard from "@/components/GlassCard";
import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";
import type { MatchWithDetails } from "@/services/matchService";
import { acceptProposal, rejectProposal } from "@/services/matchService";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const formatValue = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const Matches = () => {
  const { data: matches = [], isLoading } = useMatches();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMatch, setSelectedMatch] = useState<MatchWithDetails | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleRejectMatch = useCallback(async () => {
    if (!selectedMatch || rejecting) return;
    setRejecting(true);
    try {
      await rejectProposal(selectedMatch.id);
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      setSelectedMatch(null);
      toast({ title: "Proposta recusada" });
    } catch (err: any) {
      toast({ title: "Erro ao recusar proposta", description: err.message, variant: "destructive" });
    } finally {
      setRejecting(false);
    }
  }, [selectedMatch, rejecting, queryClient, toast]);

  const isReceivedProposal = (match: MatchWithDetails) =>
    match.status === "proposal" && match.my_item_side === "b";

  const isSentProposal = (match: MatchWithDetails) =>
    match.status === "proposal" && match.my_item_side === "a";

  const getBadge = (match: MatchWithDetails): { label: string; color: "new" | "accepted" | "pending" | "sent" } | null => {
    if (match.status === "accepted") return { label: "Aceita", color: "accepted" };
    if (isSentProposal(match)) return { label: "Enviada", color: "sent" };
    const age = Date.now() - new Date(match.created_at).getTime();
    if (age < 24 * 60 * 60 * 1000) return { label: "Nova Proposta", color: "new" };
    return { label: "Pendente", color: "pending" };
  };

  const badgeStyles: Record<string, string> = {
    new: "bg-primary text-primary-foreground border-primary/50",
    accepted: "bg-success text-white border-success/50",
    pending: "bg-foreground/10 text-foreground/70 border-foreground/20",
    sent: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  };

  const handleConfirmMatch = useCallback(async () => {
    if (!selectedMatch || confirming) return;
    setConfirming(true);
    try {
      await acceptProposal(selectedMatch.id);
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      setSelectedMatch(null);
      navigate(`/match/${selectedMatch.id}`);
    } catch (err: any) {
      toast({ title: "Erro ao confirmar troca", description: err.message, variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  }, [selectedMatch, confirming, queryClient, navigate, toast]);

  const otherItem = selectedMatch
    ? selectedMatch.my_item_side === "a" ? selectedMatch.item_b : selectedMatch.item_a
    : null;

  const myItem = selectedMatch
    ? selectedMatch.my_item_side === "a" ? selectedMatch.item_a : selectedMatch.item_b
    : null;

  const otherImages = otherItem?.item_images || [];
  const myImages = myItem?.item_images || [];

  const activeMatches = useMemo(() => matches.filter((m) => m.status !== "rejected"), [matches]);

  return (
    <ScreenLayout>
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-6 pb-4 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-0.5">
            Suas Trocas
          </span>
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
            Propostas
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-primary text-xs font-semibold">{activeMatches.length}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 w-full px-4 overflow-y-auto no-scrollbar z-10 pb-28">

        {isLoading ? (
          <div className="flex flex-col gap-4 py-2">
            <SkeletonMatchCard />
            <SkeletonMatchCard />
          </div>
        ) : activeMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Repeat2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Nenhuma proposta ainda</h2>
            <p className="text-muted-foreground text-sm mb-6">Explore itens e faça sua primeira troca!</p>
            <Button onClick={() => navigate("/explorar")} className="rounded-full px-6">
              Explorar itens
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-6">
            {activeMatches.map((match) => {
              const otherItemCard = match.my_item_side === "a" ? match.item_b : match.item_a;
              const mainImage = otherItemCard?.item_images?.[0]?.image_url;
              const badge = getBadge(match);

              return (
                <GlassCard
                  key={match.id}
                  hoverable
                  className="cursor-pointer transition-transform active:scale-[0.98] shadow-sm"
                  onClick={() => setSelectedMatch(match)}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] w-full">
                    {mainImage ? (
                      <img alt={otherItemCard.name} className="h-full w-full object-cover" src={mainImage} />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Repeat2 className="h-10 w-10 text-foreground/10" />
                      </div>
                    )}
                    
                    {badge && (
                      <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${badgeStyles[badge.color]}`}>
                        {badge.label}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 relative">
                    <h3 className="text-foreground font-bold text-lg leading-tight mb-0.5">{otherItemCard.name}</h3>
                    <p className="text-foreground font-semibold text-base mb-1.5">
                      {formatValue(otherItemCard.market_value)}
                    </p>
                    <p className="text-foreground/60 text-xs flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {otherItemCard.location || match.other_user.location || "Sem localização"}
                    </p>

                    {/* Owner */}
                    <div className="mt-3 pt-3 border-t border-foreground/8 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {match.other_user.avatar_url ? (
                          <img
                            alt={match.other_user.display_name || "Usuário"}
                            className="h-7 w-7 rounded-full object-cover border-2 border-primary/30"
                            src={match.other_user.avatar_url}
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            {(match.other_user.display_name || "?")[0]}
                          </div>
                        )}
                        <span className="text-xs font-medium text-foreground/70">
                          {match.other_user.display_name || "Usuário"}
                        </span>
                      </div>
                      {match.status === "accepted" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/match/${match.id}`);
                          }}
                          className="h-8 px-3 flex items-center justify-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Conversar
                        </button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </main>

      {/* ===== FULLSCREEN ITEM DETAIL POPUP ===== */}
      <AnimatePresence>
        {selectedMatch && otherItem && myItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md"
          >
            {/* Back button */}
            <button
              onClick={() => setSelectedMatch(null)}
              className="absolute top-4 left-4 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-foreground shadow-lg border border-foreground/10 hover:bg-background transition-colors"
              style={{ marginTop: "env(safe-area-inset-top)" }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar pb-36">
              {/* Hero image */}
              <div className="relative w-full aspect-square max-h-[50vh] bg-card overflow-hidden">
                {otherImages[0]?.image_url ? (
                  <img
                    src={otherImages[0].image_url}
                    alt={otherItem.name}
                    className="w-full h-full object-contain bg-card"
                  />
                ) : (
                  <div className="w-full h-full bg-card flex items-center justify-center">
                    <Repeat2 className="h-16 w-16 text-foreground/10" />
                  </div>
                )}
                {/* Scrim sutil só na base para transição suave */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
              </div>

              {/* Content */}
              <div className="px-6 -mt-6 relative z-10">
                {/* Other user badge */}
                <div className="flex items-center gap-2 mb-3">
                  {selectedMatch.other_user.avatar_url ? (
                    <img
                      src={selectedMatch.other_user.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover border-2 border-background"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-bold text-foreground/50">
                      {(selectedMatch.other_user.display_name || "?")[0]}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-foreground/80">
                    {selectedMatch.other_user.display_name || "Usuário"}
                  </span>
                </div>

                {/* Item name + value */}
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-1 break-words">
                  {otherItem.name}
                </h2>
                <p className="text-primary text-2xl font-bold text-glow mb-4">
                  {formatValue(otherItem.market_value)}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {otherItem.category && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                      <Tag className="h-3 w-3" />
                      {otherItem.category}
                    </span>
                  )}
                  {otherItem.location && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-xs font-medium text-foreground/60">
                      <MapPin className="h-3 w-3" />
                      {otherItem.location}
                    </span>
                  )}
                </div>

              {/* Exchange visualization */}
                <div className="rounded-2xl bg-foreground/5 border border-foreground/10 p-4 mb-6 overflow-hidden">
                  <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold mb-3 text-center">
                    Proposta de Troca
                  </p>
                  <div className="flex items-center gap-2">
                    {/* My item */}
                    <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                      <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border border-foreground/10 mb-2">
                        {myImages[0]?.image_url ? (
                          <img src={myImages[0].image_url} alt={myItem.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                      <p className="text-foreground/80 text-[11px] font-semibold truncate w-full px-1">{myItem.name}</p>
                      <p className="text-primary/70 text-[10px] font-bold">{formatValue(myItem.market_value)}</p>
                      <p className="text-foreground/30 text-[9px] mt-0.5">Seu item</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 flex items-center justify-center">
                      <ArrowRightLeft className="h-4 w-4 text-primary/60" />
                    </div>

                    {/* Their item */}
                    <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                      <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border border-primary/20 mb-2 ring-1 ring-primary/30">
                        {otherImages[0]?.image_url ? (
                          <img src={otherImages[0].image_url} alt={otherItem.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                      <p className="text-foreground/80 text-[11px] font-semibold truncate w-full px-1">{otherItem.name}</p>
                      <p className="text-primary/70 text-[10px] font-bold">{formatValue(otherItem.market_value)}</p>
                      <p className="text-foreground/30 text-[9px] mt-0.5">Item deles</p>
                    </div>
                  </div>
                </div>

                {/* Additional images */}
                {otherImages.length > 1 && (
                  <div className="mb-6">
                    <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-3">Mais fotos</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {otherImages.slice(1).map((img, i) => (
                        <button key={i} onClick={() => setZoomedImage(img.image_url)} className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-foreground/10">
                          <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed bottom actions */}
            <div
              className="fixed bottom-0 left-0 right-0 z-[110] px-6 pb-6 pt-4 bg-gradient-to-t from-background via-background to-transparent"
              style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
            >
              {selectedMatch.status === "accepted" ? (
                <button
                  onClick={() => {
                    setSelectedMatch(null);
                    navigate(`/match/${selectedMatch.id}`);
                  }}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_hsl(184_100%_50%/0.4)]"
                >
                  <MessageSquare className="h-5 w-5" />
                  Iniciar Conversa
                </button>
              ) : selectedMatch.status === "rejected" ? (
                <div className="w-full h-14 rounded-2xl bg-muted text-muted-foreground font-bold text-lg flex items-center justify-center">
                  Proposta Recusada
                </div>
              ) : isSentProposal(selectedMatch) ? (
                <div className="w-full h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 font-bold text-base flex items-center justify-center gap-2">
                  <Clock className="h-5 w-5" />
                  Aguardando resposta
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleRejectMatch}
                    disabled={rejecting}
                    className="flex-1 h-14 rounded-2xl bg-card border border-foreground/10 text-foreground/70 font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
                  >
                    {rejecting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <XIcon className="h-5 w-5" />
                        Recusar
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleConfirmMatch}
                    disabled={confirming}
                    className="flex-[2] h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_20px_hsl(184_100%_50%/0.4)] disabled:opacity-50 transition-all active:scale-[0.97]"
                  >
                    {confirming ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Handshake className="h-5 w-5" />
                        Confirmar Troca
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoomed image overlay */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center"
            onClick={() => setZoomedImage(null)}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              style={{ marginTop: "env(safe-area-inset-top)" }}
            >
              <XIcon className="h-5 w-5" />
            </button>
            <img
              src={zoomedImage}
              alt=""
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab="trocas" />
    </ScreenLayout>
  );
};

export default Matches;
