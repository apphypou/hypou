import { MessageSquare, Loader2, MapPin, Tag, Star, ArrowRightLeft, Handshake, X as XIcon, Repeat2, ArrowLeft, Clock, Send, CheckCircle2, History } from "lucide-react";
import { useMemo, useEffect } from "react";
import { SkeletonMatchCard } from "@/components/SkeletonCard";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import GlassCard from "@/components/GlassCard";
import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";
import type { MatchWithDetails } from "@/services/matchService";
import { acceptProposal, rejectProposal, confirmTrade, cancelProposal } from "@/services/matchService";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatValue } from "@/lib/utils";
import { useMatchRating } from "@/hooks/useRatings";
import RatingDialog from "@/components/RatingDialog";

const Matches = () => {
  const { data: matches = [], isLoading } = useMatches();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMatch, setSelectedMatch] = useState<MatchWithDetails | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmingTrade, setConfirmingTrade] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  const handleRejectMatch = useCallback(async () => {
    if (!selectedMatch || rejecting) return;
    setRejecting(true);
    try {
      await rejectProposal(selectedMatch.id, user!.id);
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      setSelectedMatch(null);
      toast({ title: "Proposta recusada" });
    } catch (err: any) {
      toast({ title: "Erro ao recusar proposta", description: err.message, variant: "destructive" });
    } finally {
      setRejecting(false);
    }
  }, [selectedMatch, rejecting, queryClient, toast]);

  const handleCancelProposal = useCallback(async () => {
    if (!selectedMatch || cancelling) return;
    setCancelling(true);
    try {
      await cancelProposal(selectedMatch.id, user!.id);
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      setSelectedMatch(null);
      toast({ title: "Proposta cancelada" });
    } catch (err: any) {
      toast({ title: "Erro ao cancelar proposta", description: err.message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  }, [selectedMatch, cancelling, queryClient, toast, user]);
  const handleConfirmTrade = useCallback(async () => {
    if (!selectedMatch || confirmingTrade) return;
    setConfirmingTrade(true);
    try {
      await confirmTrade(selectedMatch.id, user!.id);
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast({ title: "Troca confirmada! ✅", description: "Quando ambos confirmarem, a troca será concluída." });
      setSelectedMatch(null);
    } catch (err: any) {
      toast({ title: "Erro ao confirmar troca", description: err.message, variant: "destructive" });
    } finally {
      setConfirmingTrade(false);
    }
  }, [selectedMatch, confirmingTrade, queryClient, toast, user]);

  const isReceivedProposal = (match: MatchWithDetails) =>
    match.status === "proposal" && match.my_item_side === "b";

  const isSentProposal = (match: MatchWithDetails) =>
    match.status === "proposal" && match.my_item_side === "a";

  const getBadge = (match: MatchWithDetails): { label: string; color: "new" | "accepted" | "pending" | "sent" | "completed" } | null => {
    if (match.status === "completed") return { label: "Concluída", color: "completed" };
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
    sent: "bg-amber-500 text-white border-amber-600",
    completed: "bg-emerald-600/20 text-emerald-500 border-emerald-500/30",
  };

  const handleConfirmMatch = useCallback(async () => {
    if (!selectedMatch || confirming) return;
    setConfirming(true);
    try {
      await acceptProposal(selectedMatch.id, user!.id);
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

  const activeMatches = useMemo(() => matches.filter((m) => m.status !== "rejected" && m.status !== "completed"), [matches]);
  const historyMatches = useMemo(() => matches.filter((m) => m.status === "completed" || m.status === "rejected"), [matches]);
  const displayedMatches = activeTab === "active" ? activeMatches : historyMatches;

  // Check if I already confirmed
  const myConfirmed = selectedMatch
    ? selectedMatch.my_item_side === "a" ? selectedMatch.confirmed_by_a : selectedMatch.confirmed_by_b
    : false;
  const otherConfirmed = selectedMatch
    ? selectedMatch.my_item_side === "a" ? selectedMatch.confirmed_by_b : selectedMatch.confirmed_by_a
    : false;

  return (
    <ScreenLayout>
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-6 pb-2 shrink-0">
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

      {/* Tabs */}
      <div className="flex gap-2 px-6 pb-3 shrink-0">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === "active"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-foreground/10 text-foreground/50"
          }`}
        >
          Ativas ({activeMatches.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "history"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-foreground/10 text-foreground/50"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          Histórico ({historyMatches.length})
        </button>
      </div>

      {/* Main Content */}
      <main className="relative flex-1 w-full px-4 overflow-y-auto no-scrollbar z-10 pb-28">

        {isLoading ? (
          <div className="flex flex-col gap-4 py-2">
            <SkeletonMatchCard />
            <SkeletonMatchCard />
          </div>
        ) : displayedMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              {activeTab === "active" ? (
                <Repeat2 className="h-10 w-10 text-primary" />
              ) : (
                <History className="h-10 w-10 text-primary/50" />
              )}
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              {activeTab === "active" ? "Nenhuma proposta ativa" : "Nenhuma troca no histórico"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              {activeTab === "active"
                ? "Explore itens e faça sua primeira troca!"
                : "Suas trocas concluídas e recusadas aparecerão aqui."}
            </p>
            {activeTab === "active" && (
              <Button onClick={() => navigate("/explorar")} className="rounded-full px-6">
                Explorar itens
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-6">
            {displayedMatches.map((match) => {
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
                      {(match.status === "accepted" || match.status === "completed") && (
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
            className="fixed inset-0 z-[100] bg-background"
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
              <div className="relative w-full bg-background overflow-hidden" style={{ minHeight: '45vh' }}>
                {otherImages[0]?.image_url ? (
                  <img
                    src={otherImages[0].image_url}
                    alt={otherItem.name}
                    className="w-full h-full absolute inset-0 object-cover"
                  />
                ) : (
                  <div className="w-full h-full absolute inset-0 bg-background flex items-center justify-center">
                    <Repeat2 className="h-16 w-16 text-foreground/10" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-[65%]" style={{ background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)) 15%, hsl(var(--background) / 0.85) 35%, hsl(var(--background) / 0.4) 60%, hsl(var(--background) / 0.08) 85%, transparent 100%)' }} />
              </div>

              {/* Content - overlaps image */}
              <div className="px-6 -mt-12 relative z-10">
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
                <div className="rounded-2xl bg-foreground/[0.07] border border-foreground/10 p-5 mb-6 overflow-hidden">
                  <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold mb-4 text-center">
                    {selectedMatch.status === "completed" ? "Troca Concluída ✅" : "Proposta de Troca"}
                  </p>
                  <div className="flex items-center gap-3">
                    {/* My item */}
                    <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                      <div className="w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border border-foreground/10 mb-2.5 shadow-md">
                        {myImages[0]?.image_url ? (
                          <img src={myImages[0].image_url} alt={myItem.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      <p className="text-foreground/90 text-xs font-semibold truncate w-full px-1">{myItem.name}</p>
                      <p className="text-primary text-[11px] font-bold mt-0.5">{formatValue(myItem.market_value)}</p>
                      <p className="text-foreground/30 text-[9px] mt-1">Seu item</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      <ArrowRightLeft className="h-4 w-4 text-primary/70" />
                    </div>

                    {/* Their item */}
                    <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                      <div className="w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border border-primary/20 mb-2.5 ring-2 ring-primary/20 shadow-md shadow-primary/10">
                        {otherImages[0]?.image_url ? (
                          <img src={otherImages[0].image_url} alt={otherItem.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      <p className="text-foreground/90 text-xs font-semibold truncate w-full px-1">{otherItem.name}</p>
                      <p className="text-primary text-[11px] font-bold mt-0.5">{formatValue(otherItem.market_value)}</p>
                      <p className="text-foreground/30 text-[9px] mt-1">Item deles</p>
                    </div>
                  </div>

                  {/* Trade confirmation status */}
                  {selectedMatch.status === "accepted" && (
                    <div className="mt-4 pt-3 border-t border-foreground/10">
                      <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold mb-2 text-center">
                        Confirmação de entrega
                      </p>
                      <div className="flex justify-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className={`h-4 w-4 ${myConfirmed ? "text-success" : "text-foreground/20"}`} />
                          <span className={`text-xs font-semibold ${myConfirmed ? "text-success" : "text-foreground/40"}`}>
                            Você
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className={`h-4 w-4 ${otherConfirmed ? "text-success" : "text-foreground/20"}`} />
                          <span className={`text-xs font-semibold ${otherConfirmed ? "text-success" : "text-foreground/40"}`}>
                            {selectedMatch.other_user.display_name || "Outro"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
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
              {selectedMatch.status === "completed" ? (
                <div className="w-full h-14 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 font-bold text-base flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Troca Concluída
                </div>
              ) : selectedMatch.status === "accepted" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedMatch(null);
                      navigate(`/match/${selectedMatch.id}`);
                    }}
                    className="flex-1 h-14 rounded-2xl bg-card border border-foreground/10 text-foreground font-bold text-base flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-5 w-5" />
                    Chat
                  </button>
                  {!myConfirmed ? (
                    <button
                      onClick={handleConfirmTrade}
                      disabled={confirmingTrade}
                      className="flex-[2] h-14 rounded-2xl bg-success text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_20px_hsl(142_71%_45%/0.3)] disabled:opacity-50"
                    >
                      {confirmingTrade ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          Confirmar Entrega
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex-[2] h-14 rounded-2xl bg-success/10 border border-success/20 text-success font-bold text-sm flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Aguardando outro confirmar
                    </div>
                  )}
                </div>
              ) : selectedMatch.status === "rejected" ? (
                <div className="w-full h-14 rounded-2xl bg-muted text-muted-foreground font-bold text-lg flex items-center justify-center">
                  Proposta Recusada
                </div>
              ) : isSentProposal(selectedMatch) ? (
                <div className="space-y-3">
                  <div className="w-full h-14 rounded-2xl bg-amber-600 border border-amber-700 text-white font-bold text-base flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5" />
                    Aguardando resposta
                  </div>
                  <button
                    onClick={handleCancelProposal}
                    disabled={cancelling}
                    className="w-full h-11 rounded-2xl bg-card border border-foreground/10 text-foreground/50 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
                  >
                    {cancelling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XIcon className="h-4 w-4" />
                        Cancelar proposta
                      </>
                    )}
                  </button>
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
                        Aceitar Proposta
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
