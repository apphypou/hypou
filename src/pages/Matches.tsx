import { MessageSquare, Loader2, MapPin, Tag, Star, ArrowRightLeft, Handshake, X as XIcon } from "lucide-react";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import GlassCard from "@/components/GlassCard";
import { useMatches } from "@/hooks/useMatches";
import type { MatchWithDetails } from "@/services/matchService";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const formatValue = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const Matches = () => {
  const { data: matches = [], isLoading } = useMatches();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMatch, setSelectedMatch] = useState<MatchWithDetails | null>(null);
  const [confirming, setConfirming] = useState(false);

  const getBadge = (match: MatchWithDetails) => {
    const age = Date.now() - new Date(match.created_at).getTime();
    if (age < 24 * 60 * 60 * 1000) return "Nova Proposta";
    if (match.status === "accepted") return "Aceita";
    return null;
  };

  const handleConfirmMatch = useCallback(async () => {
    if (!selectedMatch || confirming) return;
    setConfirming(true);

    try {
      const { error } = await supabase
        .from("matches")
        .update({ status: "accepted" })
        .eq("id", selectedMatch.id);

      if (error) throw error;

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

  return (
    <ScreenLayout>
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-12 pb-4 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-0.5">
            Suas Trocas
          </span>
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
            Propostas de Troca
          </h1>
        </div>
        <div className="flex gap-3" />
      </header>

      {/* Main Content */}
      <main className="relative flex-1 w-full px-5 overflow-y-auto no-scrollbar z-10 pb-28">
        <div className="flex items-center justify-between mb-6 mt-2">
          <h2 className="text-sm font-bold text-foreground/90 uppercase tracking-widest">Interesses Recebidos</h2>
          <div className="flex items-center gap-1">
            <span className="text-primary text-xs font-semibold">{matches.length} Ativo{matches.length !== 1 ? "s" : ""}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary neon-glow" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">🤝</span>
            <h2 className="text-xl font-bold text-foreground mb-2">Nenhuma proposta ainda</h2>
            <p className="text-muted-foreground text-sm">Continue explorando para encontrar trocas!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 pb-6">
            {matches.map((match) => {
              const otherItemCard = match.my_item_side === "a" ? match.item_b : match.item_a;
              const mainImage = otherItemCard?.item_images?.[0]?.image_url;
              const badge = getBadge(match);

              return (
                <GlassCard
                  key={match.id}
                  hoverable
                  className="shadow-[0_4px_20px_hsl(184_100%_50%/0.15)] cursor-pointer"
                  onClick={() => setSelectedMatch(match)}
                >
                  {/* Image */}
                  <div className="relative h-48 w-full">
                    {mainImage ? (
                      <img alt={otherItemCard.name} className="h-full w-full object-cover" src={mainImage} />
                    ) : (
                      <div className="h-full w-full bg-card flex items-center justify-center">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                    {badge && (
                      <div className="absolute top-4 right-4 bg-background/60 backdrop-blur-md px-3 py-1 rounded-full border border-primary/30">
                        <span className="text-[10px] font-bold text-primary tracking-wider uppercase">{badge}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 relative">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-foreground font-bold text-xl leading-tight mb-1">{otherItemCard.name}</h3>
                        <p className="text-foreground/50 text-xs">{otherItemCard.location || match.other_user.location || "Sem localização"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-bold text-lg text-glow">{formatValue(otherItemCard.market_value)}</p>
                        <p className="text-foreground/40 text-[10px]">Valor de mercado</p>
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="mt-4 pt-4 border-t border-foreground/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          {match.other_user.avatar_url ? (
                            <img
                              alt={match.other_user.display_name || "Usuário"}
                              className="h-8 w-8 rounded-full object-cover border border-foreground/20"
                              src={match.other_user.avatar_url}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-card border border-foreground/20 flex items-center justify-center text-xs font-bold text-foreground/40">
                              {(match.other_user.display_name || "?")[0]}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-foreground/80">
                          {match.other_user.display_name || "Usuário"}
                        </span>
                      </div>
                      {match.status === "accepted" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/match/${match.id}`);
                          }}
                          className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <MessageSquare className="h-4 w-4" />
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
            {/* Close button */}
            <button
              onClick={() => setSelectedMatch(null)}
              className="absolute top-4 right-4 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-foreground/10 text-foreground/70 hover:bg-foreground/20 transition-colors"
              style={{ marginTop: "env(safe-area-inset-top)" }}
            >
              <XIcon className="h-5 w-5" />
            </button>

            <div className="h-full w-full overflow-y-auto no-scrollbar pb-36">
              {/* Hero image */}
              <div className="relative w-full h-72">
                {otherImages[0]?.image_url ? (
                  <img
                    src={otherImages[0].image_url}
                    alt={otherItem.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-card flex items-center justify-center">
                    <span className="text-6xl">📦</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              </div>

              {/* Content */}
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
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-1">
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
                <div className="rounded-2xl bg-foreground/5 border border-foreground/10 p-4 mb-6">
                  <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold mb-3 text-center">
                    Proposta de Troca
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    {/* My item */}
                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-foreground/10 mb-2">
                        {myImages[0]?.image_url ? (
                          <img src={myImages[0].image_url} alt={myItem.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                      <p className="text-foreground/80 text-xs font-semibold truncate w-full">{myItem.name}</p>
                      <p className="text-primary/70 text-[10px] font-bold">{formatValue(myItem.market_value)}</p>
                      <p className="text-foreground/30 text-[9px] mt-0.5">Seu item</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                      <ArrowRightLeft className="h-5 w-5 text-primary/60" />
                    </div>

                    {/* Their item */}
                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-primary/20 mb-2 ring-1 ring-primary/30">
                        {otherImages[0]?.image_url ? (
                          <img src={otherImages[0].image_url} alt={otherItem.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                      <p className="text-foreground/80 text-xs font-semibold truncate w-full">{otherItem.name}</p>
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
                        <div key={i} className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-foreground/10">
                          <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
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
                  Ir para conversa
                </button>
              ) : (
                <button
                  onClick={handleConfirmMatch}
                  disabled={confirming}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_hsl(184_100%_50%/0.4)] disabled:opacity-50 transition-all active:scale-[0.97]"
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
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab="trocas" />
    </ScreenLayout>
  );
};

export default Matches;
