import { PlusCircle, Share2 } from "lucide-react";
import emptyChestImg from "@/assets/empty-chest.png";
import { SkeletonSwipeCard } from "@/components/SkeletonCard";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRecommendedItems, getPublicExploreItems } from "@/services/itemService";
import { createSwipe } from "@/services/swipeService";
import { createProposal } from "@/services/matchService";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import SelectItemDialog from "@/components/SelectItemDialog";
import GuestPromptDialog from "@/components/GuestPromptDialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";
import SwipeCard, { type SwipeCardHandle } from "@/components/SwipeCard";
import SwipeToggle from "@/components/SwipeToggle";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/lib/haptics";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { categories } from "@/constants/categories";
import { formatValue } from "@/lib/utils";
import { shareContent } from "@/lib/share";
import { findRefreshIndex } from "@/lib/pullToRefresh";

const PENDING_LIKE_KEY = "hypou:pending-like-item";
const EXPLORE_FILTERS_KEY = "hypou:explore-filters";
const EXPLORE_FILTER_MAX_CENTS = 500_000_000;

type ExploreFilters = {
  categories: string[];
  valueRange: [number, number];
};

const getInitialExploreFilters = (): ExploreFilters => {
  if (typeof window === "undefined") return { categories: [], valueRange: [0, EXPLORE_FILTER_MAX_CENTS] };
  try {
    const raw = localStorage.getItem(EXPLORE_FILTERS_KEY);
    if (!raw) return { categories: [], valueRange: [0, EXPLORE_FILTER_MAX_CENTS] };
    const parsed = JSON.parse(raw);
    const range = Array.isArray(parsed?.valueRange) ? parsed.valueRange : [0, EXPLORE_FILTER_MAX_CENTS];
    return {
      categories: Array.isArray(parsed?.categories) ? parsed.categories : [],
      valueRange: [
        Math.max(0, Number(range[0]) || 0),
        Math.min(EXPLORE_FILTER_MAX_CENTS, Number(range[1]) || EXPLORE_FILTER_MAX_CENTS),
      ],
    };
  } catch {
    return { categories: [], valueRange: [0, EXPLORE_FILTER_MAX_CENTS] };
  }
};

const filterExploreItems = (items: any[], filters: ExploreFilters) => {
  const [minValue, maxValue] = filters.valueRange;
  return items.filter((item: any) => {
    const matchesCategory = filters.categories.length === 0 || filters.categories.includes(item.category);
    const value = item.market_value || 0;
    return matchesCategory && value >= minValue && value <= maxValue;
  });
};

const Explorar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isGuest = !user;

  // Onboarding guard
  const { data: onboardingProfile } = useQuery({
    queryKey: ["onboarding-check", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (user && onboardingProfile && !onboardingProfile.onboarding_completed) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, onboardingProfile, navigate]);

  // Restore pending proposal context if user came back from /novo-item
  // Pode ser desativado em Configurações (hypou:disable-pending-resume)
  useEffect(() => {
    if (!user) return;
    try {
      if (localStorage.getItem("hypou:disable-pending-resume") === "1") {
        sessionStorage.removeItem(PENDING_LIKE_KEY);
        return;
      }
      const raw = sessionStorage.getItem(PENDING_LIKE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.id) {
        setPendingLikeItem(parsed);
        setShowSelectItem(true);
      }
    } catch { /* ignore */ }
  }, [user]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const swipingRef = useRef(false);
  const cardRef = useRef<SwipeCardHandle>(null);
  const refreshItemIdRef = useRef<string | null>(null);
  const refreshIndexRef = useRef(0);

  const [likeStreak, setLikeStreak] = useState(0);
  const [showStreak, setShowStreak] = useState(false);

  // Guest prompt
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  // SelectItemDialog state
  const [showSelectItem, setShowSelectItem] = useState(false);
  const [pendingLikeItem, setPendingLikeItem] = useState<any>(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exploreFilters, setExploreFilters] = useState<ExploreFilters>(getInitialExploreFilters);

  const dragDirectionValue = useMotionValue(0);

  // Live: novos itens publicados aparecem sem reload
  useRealtimeInvalidate(
    [
      { table: "items", event: "INSERT", invalidateKeys: [["explore-items"], ["recommended-items"]] },
      { table: "items", event: "UPDATE", invalidateKeys: [["explore-items"], ["recommended-items"]] },
    ],
    true
  );

  // Fetch items — recommended for logged-in, public for guests
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["explore-items", user?.id],
    queryFn: async () => {
      if (user) {
        return getRecommendedItems(user.id);
      }
      return getPublicExploreItems();
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    localStorage.setItem(EXPLORE_FILTERS_KEY, JSON.stringify(exploreFilters));
    setCurrentIndex(0);
    setEpoch((e) => e + 1);
  }, [exploreFilters]);

  const filteredItems = useMemo(() => {
    return filterExploreItems(items, exploreFilters);
  }, [items, exploreFilters]);

  const currentItem = filteredItems.length > 0 ? filteredItems[currentIndex % filteredItems.length] : null;
  const nextItem = filteredItems.length > 0 ? filteredItems[(currentIndex + 1) % filteredItems.length] : null;
  const hasActiveFilters =
    exploreFilters.categories.length > 0 ||
    exploreFilters.valueRange[0] > 0 ||
    exploreFilters.valueRange[1] < EXPLORE_FILTER_MAX_CENTS;

  const handleRefresh = useCallback(async () => {
    refreshItemIdRef.current = currentItem?.id ?? null;
    refreshIndexRef.current = currentIndex;
    await queryClient.refetchQueries({ queryKey: ["explore-items", user?.id], exact: true });

    const refreshedItems = queryClient.getQueryData<any[]>(["explore-items", user?.id]) ?? [];
    const refreshedFilteredItems = filterExploreItems(refreshedItems, exploreFilters);
    setCurrentIndex(
      findRefreshIndex(refreshedFilteredItems, refreshItemIdRef.current, refreshIndexRef.current),
    );
    refreshItemIdRef.current = null;
    setEpoch((value) => value + 1);
  }, [currentIndex, currentItem?.id, exploreFilters, queryClient, user?.id]);

  const advanceCard = useCallback(() => {
    setEpoch((e) => e + 1);
    dragDirectionValue.set(0);
    setCurrentIndex((i) => i + 1);
  }, [dragDirectionValue]);

  const triggerStreak = useCallback((direction: string) => {
    if (direction === "like") {
      setLikeStreak((s) => {
        const next = s + 1;
        if (next >= 3) {
          setShowStreak(true);
          setTimeout(() => setShowStreak(false), 1500);
        }
        return next;
      });
    } else {
      setLikeStreak(0);
      setShowStreak(false);
    }
  }, []);

  const recordSwipeInBackground = useCallback(
    (direction: "like" | "dislike", itemId: string) => {
      if (!user) return;
      (async () => {
        try {
          await createSwipe(user.id, itemId, direction);
        } catch (err: any) {
          if (!err.message?.includes("duplicate")) {
            toast({ title: "Erro ao registrar swipe", description: err.message, variant: "destructive" });
          }
        }
      })();
    },
    [user, toast]
  );

  const handleSwipeComplete = useCallback(
    (direction: "like" | "dislike") => {
      if (swipingRef.current || !currentItem) return;
      swipingRef.current = true;

      // Guest mode: show prompt on like
      if (isGuest && direction === "like") {
        setShowGuestPrompt(true);
        swipingRef.current = false;
        return;
      }

      if (isGuest) {
        advanceCard();
        swipingRef.current = false;
        return;
      }

      triggerStreak(direction);

      if (direction === "like") {
        recordSwipeInBackground("like", currentItem.id);
        haptic("light");
        // Persist so the user can finish the proposal even after navigating to /novo-item
        try {
          sessionStorage.setItem(PENDING_LIKE_KEY, JSON.stringify({
            id: currentItem.id,
            user_id: currentItem.user_id,
            name: currentItem.name,
          }));
        } catch { /* storage may be blocked */ }
        setPendingLikeItem(currentItem);
        setShowSelectItem(true);
      } else {
        recordSwipeInBackground("dislike", currentItem.id);
      }

      advanceCard();
      swipingRef.current = false;
    },
    [user, isGuest, currentItem, advanceCard, triggerStreak, recordSwipeInBackground, toast]
  );

  const handleProposalConfirm = useCallback(
    async (myItemIds: string[], cashAmountCents = 0) => {
      if (!user || !pendingLikeItem) return;
      setProposalLoading(true);
      try {
        await createProposal(user.id, myItemIds, pendingLikeItem.id, pendingLikeItem.user_id, cashAmountCents);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["matches", user.id] }),
          queryClient.invalidateQueries({ queryKey: ["profile-stats", user.id] }),
        ]);
        toast({ title: "🤝 Proposta enviada!", description: `Proposta de troca enviada com sucesso.` });
        haptic("success");
      } catch (err: any) {
        if (err.message?.includes("duplicate")) {
          toast({ title: "Proposta já existe", description: "Você já enviou uma proposta para este item." });
        } else {
          toast({ title: "Erro ao enviar proposta", description: err.message, variant: "destructive" });
          haptic("error");
        }
      } finally {
        setProposalLoading(false);
        setShowSelectItem(false);
        setPendingLikeItem(null);
        try { sessionStorage.removeItem(PENDING_LIKE_KEY); } catch { /* */ }
      }
    },
    [user, pendingLikeItem, toast, queryClient]
  );

  const handleDragDirectionChange = useCallback(
    (rawX: number) => {
      dragDirectionValue.set(rawX);
    },
    [dragDirectionValue]
  );

  // Preload image after next
  const afterNextItem = filteredItems.length > 0 ? filteredItems[(currentIndex + 2) % filteredItems.length] : null;
  const afterNextImage = afterNextItem?.item_images?.[0]?.image_url;

  useEffect(() => {
    if (afterNextImage) {
      import("@/lib/imageUrl").then(({ cdnFull }) => {
        const img = new window.Image();
        img.src = cdnFull(afterNextImage);
      });
    }
  }, [afterNextImage]);

  const feedEnded = false;

  return (
    <ScreenLayout edgeToEdgeTop onRefresh={handleRefresh}>
      {/* Main Card Area */}
      <main className="relative flex-1 flex flex-col items-center justify-start w-full pt-0 z-10 min-h-0" style={{ perspective: "1200px" }}>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center w-full">
            <SkeletonSwipeCard />
          </div>
        ) : feedEnded || filteredItems.length === 0 ? (
          /* ===== EMPTY STATE ===== */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <motion.div
              className="mb-5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {filteredItems.length === 0 ? (
                <img src={emptyChestImg} alt="Baú vazio" className="w-56 h-56 object-contain" />
              ) : (
                <span className="text-7xl">✅</span>
              )}
            </motion.div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {filteredItems.length === 0
                ? "Ainda não há itens por aqui"
                : "Você já viu tudo!"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              {filteredItems.length === 0
                ? hasActiveFilters
                  ? "Não encontramos itens com esses filtros. Ajuste interesses ou faixa de valor."
                  : isGuest
                  ? "Crie sua conta e seja o primeiro a cadastrar um item!"
                  : "Seja o primeiro a cadastrar um item ou convide amigos!"
                : "Cadastre mais itens para ampliar suas possibilidades de troca."}
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              {hasActiveFilters ? (
                <button
                  onClick={() => setExploreFilters({ categories: [], valueRange: [0, EXPLORE_FILTER_MAX_CENTS] })}
                  className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider neon-glow transition-all flex items-center justify-center gap-2"
                >
                  Limpar filtros
                </button>
              ) : isGuest ? (
                <>
                  <button
                    onClick={() => navigate("/cadastro")}
                    className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider neon-glow transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Criar conta grátis
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full py-3 rounded-full bg-card border border-foreground/10 text-foreground text-sm font-bold uppercase tracking-wider hover:bg-card/80 transition-all flex items-center justify-center gap-2"
                  >
                    Já tenho conta
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/novo-item")}
                    className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider neon-glow transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Cadastrar meu item
                  </button>


                  <button
                    onClick={() => {
                      void shareContent({
                        title: "Hypou — Troque seus itens",
                        text: "Conheça o Hypou, o app de trocas inteligentes!",
                        url: "https://hypou.lovable.app",
                      }).catch((error) => {
                        if (error?.name !== "AbortError") console.error("Falha ao compartilhar Hypou", error);
                      });
                    }}
                    className="w-full py-3 rounded-full bg-card border border-foreground/10 text-foreground text-sm font-bold uppercase tracking-wider hover:bg-card/80 transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Convidar amigos
                  </button>
                </>
              )}
            </div>
          </div>
        ) : currentItem ? (
          <>
            <div className="relative w-full h-full shrink-0">
              {/* Streak indicator */}
              <AnimatePresence>
                {showStreak && likeStreak >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute -top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-xl"
                  >
                    <span className="text-lg">🔥</span>
                    <span className="text-primary text-sm font-bold">{likeStreak} curtidas seguidas!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Next card — pre-rendered behind */}
              {nextItem && nextItem.id !== currentItem.id && (
                <SwipeCard
                  key={`standby-${nextItem.id}`}
                  item={nextItem}
                  onSwipeComplete={() => {}}
                  standby
                  revealMotionX={dragDirectionValue}
                />
              )}

              {/* Active draggable card */}
              <SwipeCard
                key={`active-${currentItem.id}-${epoch}`}
                ref={cardRef}
                item={currentItem}
                onSwipeComplete={handleSwipeComplete}
                onDragDirectionChange={handleDragDirectionChange}
                disabled={swipingRef.current}
                matchedOwnItem={currentItem.matched_own_item ? { ...currentItem.matched_own_item, count: currentItem.matched_items_count } : null}
                onOpenFilters={() => setFiltersOpen(true)}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </>
        ) : null}
      </main>

      {!filtersOpen && !showSelectItem && <BottomNav activeTab="explorar" />}

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-foreground/10 bg-background pb-[calc(var(--safe-area-bottom)+1.5rem)]">
          <SheetHeader>
            <SheetTitle>Configurar busca</SheetTitle>
          </SheetHeader>

          <div className="mt-5 space-y-6">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Interesses</h3>
                <span className="text-xs text-muted-foreground">{exploreFilters.categories.length || "Todos"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = exploreFilters.categories.includes(cat.label);
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() =>
                        setExploreFilters((current) => ({
                          ...current,
                          categories: selected
                            ? current.categories.filter((value) => value !== cat.label)
                            : [...current.categories, cat.label],
                        }))
                      }
                      className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-foreground/10 bg-card text-foreground/65"
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Média de valores</h3>
                <span className="text-xs font-semibold text-primary">
                  {formatValue(exploreFilters.valueRange[0])} - {formatValue(exploreFilters.valueRange[1])}
                </span>
              </div>
              <Slider
                value={exploreFilters.valueRange}
                min={0}
                max={EXPLORE_FILTER_MAX_CENTS}
                step={5_000}
                onValueChange={(value) =>
                  setExploreFilters((current) => ({
                    ...current,
                    valueRange: [value[0] || 0, value[1] || EXPLORE_FILTER_MAX_CENTS],
                  }))
                }
              />
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>R$ 0</span>
                <span>R$ 5 mi</span>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExploreFilters({ categories: [], valueRange: [0, EXPLORE_FILTER_MAX_CENTS] })}
                className="h-12 rounded-2xl border border-foreground/10 bg-card text-sm font-bold text-foreground"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="h-12 rounded-2xl bg-primary text-sm font-bold text-primary-foreground"
              >
                Aplicar
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Guest prompt dialog */}
      <GuestPromptDialog
        open={showGuestPrompt}
        onClose={() => setShowGuestPrompt(false)}
      />

      {/* Select item dialog (authenticated only) */}
      {!isGuest && (
        <SelectItemDialog
          open={showSelectItem}
          onClose={() => {
            setShowSelectItem(false);
            setPendingLikeItem(null);
            try { sessionStorage.removeItem(PENDING_LIKE_KEY); } catch { /* */ }
          }}
          onConfirm={handleProposalConfirm}
          targetItemName={pendingLikeItem?.name}
          targetItemValue={pendingLikeItem?.market_value}
          targetMarginUp={(pendingLikeItem as any)?.margin_up}
          targetMarginDown={(pendingLikeItem as any)?.margin_down}
          loading={proposalLoading}
        />
      )}
    </ScreenLayout>
  );
};

export default Explorar;
