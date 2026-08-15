import { Bookmark, PlusCircle, Share2, SlidersHorizontal } from "lucide-react";
import emptyChestImg from "@/assets/empty-chest.png";
import { SkeletonSwipeCard } from "@/components/SkeletonCard";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getItemById, getRecommendedItems, getPublicExploreItems } from "@/services/itemService";
import { createSwipe } from "@/services/swipeService";
import { createProposal } from "@/services/matchService";
import { addFavorite, getFavoriteItemIds, removeFavorite } from "@/services/favoriteService";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import SelectItemDialog from "@/components/SelectItemDialog";
import GuestPromptDialog from "@/components/GuestPromptDialog";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
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
import { formatValue, getErrorMessage } from "@/lib/utils";
import { buildPublicItemUrl, shareContent } from "@/lib/share";
import { shouldRecycleExploreFeed } from "@/lib/exploreFeed";
import { getOnboardingRouteState } from "@/lib/onboarding";
import { cdnFull } from "@/lib/imageUrl";
import { preloadImage } from "@/lib/mediaPreload";

const PENDING_LIKE_KEY = "hypou:pending-like-item";
const EXPLORE_FILTERS_KEY = "hypou:explore-filters";
const EXPLORE_FILTER_MAX_CENTS = 500_000_000;
const ignoreSwipeComplete = () => undefined;

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
  const location = useLocation();
  const queryClient = useQueryClient();
  const isGuest = !user;
  const focusedItemFromNavigation = (location.state as { focusedItem?: any } | null)?.focusedItem ?? null;
  const focusedItemId = new URLSearchParams(location.search).get("item");
  const [focusedItem, setFocusedItem] = useState<any>(focusedItemFromNavigation);

  const { data: focusedItemFromLink } = useQuery({
    queryKey: ["explore-focused-item", focusedItemId],
    queryFn: () => getItemById(focusedItemId!),
    enabled: !!focusedItemId,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (focusedItemFromNavigation) setFocusedItem(focusedItemFromNavigation);
  }, [focusedItemFromNavigation]);

  useEffect(() => {
    if (!focusedItemFromNavigation && focusedItemFromLink) setFocusedItem(focusedItemFromLink);
  }, [focusedItemFromLink, focusedItemFromNavigation]);

  // Onboarding guard
  const {
    data: onboardingProfile,
    isLoading: onboardingLoading,
    isFetching: onboardingFetching,
    isError: onboardingError,
  } = useQuery({
    queryKey: ["onboarding-check", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const onboardingState = getOnboardingRouteState({
    profile: onboardingProfile,
    isLoading: onboardingLoading,
    isFetching: onboardingFetching,
    isError: onboardingError,
  });

  useEffect(() => {
    if (user && onboardingState === "onboarding") {
      navigate("/onboarding", { replace: true });
    }
  }, [user, onboardingState, navigate]);

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

  const [dismissedItemIds, setDismissedItemIds] = useState<Set<string>>(() => new Set());
  const swipingRef = useRef(false);
  const swipingItemIdRef = useRef<string | null>(null);
  const recycledFeedKeyRef = useRef<string | null>(null);
  const cardRef = useRef<SwipeCardHandle>(null);

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
      ...(user
        ? [
            { table: "matches", invalidateKeys: [["explore-items", user.id], ["matches", user.id]] },
            { table: "favorites", filter: `user_id=eq.${user.id}`, invalidateKeys: [["favorite-item-ids", user.id]] },
          ]
        : []),
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
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });

  const { data: favoriteItemIds = [] } = useQuery({
    queryKey: ["favorite-item-ids", user?.id],
    queryFn: () => getFavoriteItemIds(user!.id),
    enabled: !!user,
  });
  const favoriteItemIdSet = useMemo(() => new Set(favoriteItemIds), [favoriteItemIds]);

  useEffect(() => {
    localStorage.setItem(EXPLORE_FILTERS_KEY, JSON.stringify(exploreFilters));
  }, [exploreFilters]);

  const filteredItems = useMemo(() => {
    const feedItems = filterExploreItems(items, exploreFilters);
    return focusedItem
      ? [focusedItem, ...feedItems.filter((item: any) => item.id !== focusedItem.id)]
      : feedItems;
  }, [focusedItem, items, exploreFilters]);

  const visibleItems = useMemo(
    () => filteredItems.filter((item: any) => !dismissedItemIds.has(item.id)),
    [dismissedItemIds, filteredItems],
  );
  const currentItem = visibleItems[0] ?? null;
  const nextItem = visibleItems[1] ?? null;
  const currentMatchedOwnItem = useMemo(
    () => currentItem?.matched_own_item
      ? { ...currentItem.matched_own_item, count: currentItem.matched_items_count }
      : null,
    [currentItem],
  );
  const nextMatchedOwnItem = useMemo(
    () => nextItem?.matched_own_item
      ? { ...nextItem.matched_own_item, count: nextItem.matched_items_count }
      : null,
    [nextItem],
  );
  const hasActiveFilters =
    exploreFilters.categories.length > 0 ||
    exploreFilters.valueRange[0] > 0 ||
    exploreFilters.valueRange[1] < EXPLORE_FILTER_MAX_CENTS;
  const allCategoriesSelected = categories.every((category) => exploreFilters.categories.includes(category.label));

  const handleRefresh = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: ["explore-items", user?.id], exact: true });
    setDismissedItemIds((current) => current.size === filteredItems.length ? new Set() : current);
  }, [filteredItems.length, queryClient, user?.id]);

  useEffect(() => {
    const feedKey = filteredItems.map((item: any) => item.id).join(":");
    if (!shouldRecycleExploreFeed(filteredItems.length, visibleItems.length, isLoading)) {
      if (visibleItems.length > 0) recycledFeedKeyRef.current = null;
      return;
    }
    if (recycledFeedKeyRef.current === feedKey) return;

    // The server may return a fallback list that contains cards this session
    // already dismissed. Recycle only after the whole loaded batch is gone so
    // one stale cached result cannot leave Explore stuck on an empty feed.
    recycledFeedKeyRef.current = feedKey;
    setDismissedItemIds(new Set());
    void queryClient.refetchQueries({ queryKey: ["explore-items", user?.id], exact: true });
  }, [filteredItems, isLoading, queryClient, user?.id, visibleItems.length]);

  const advanceCard = useCallback((itemId: string) => {
    if (focusedItem?.id === itemId) setFocusedItem(null);
    setDismissedItemIds((current) => {
      if (current.has(itemId)) return current;
      const next = new Set(current);
      next.add(itemId);
      return next;
    });
    dragDirectionValue.set(0);
  }, [dragDirectionValue, focusedItem]);

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
      const queryKey = ["explore-items", user.id];
      queryClient.setQueryData<any[]>(queryKey, (current = []) => current.filter((item) => item.id !== itemId));

      (async () => {
        try {
          await createSwipe(user.id, itemId, direction);
        } catch (err: any) {
          if (!err.message?.includes("duplicate")) {
            void queryClient.invalidateQueries({ queryKey });
            toast({ title: "Erro ao registrar swipe", description: getErrorMessage(err), variant: "destructive" });
          }
        }
      })();
    },
    [user, toast, queryClient]
  );

  const handleSwipeComplete = useCallback(
    (direction: "like" | "dislike") => {
      const item = currentItem;
      if (swipingRef.current || !item || swipingItemIdRef.current === item.id) return;
      swipingRef.current = true;
      swipingItemIdRef.current = item.id;

      // Guest mode: show prompt on like
      if (isGuest && direction === "like") {
        setShowGuestPrompt(true);
        swipingRef.current = false;
        swipingItemIdRef.current = null;
        return;
      }

      if (isGuest) {
        advanceCard(item.id);
        swipingRef.current = false;
        swipingItemIdRef.current = null;
        return;
      }

      triggerStreak(direction);

      if (direction === "like") {
        recordSwipeInBackground("like", item.id);
        haptic("light");
        // Persist so the user can finish the proposal even after navigating to /novo-item
        try {
          sessionStorage.setItem(PENDING_LIKE_KEY, JSON.stringify({
            id: item.id,
            user_id: item.user_id,
            name: item.name,
          }));
        } catch { /* storage may be blocked */ }
        setPendingLikeItem(item);
      } else {
        recordSwipeInBackground("dislike", item.id);
      }

      advanceCard(item.id);
      if (direction === "like") requestAnimationFrame(() => setShowSelectItem(true));
      swipingRef.current = false;
      swipingItemIdRef.current = null;
    },
    [user, isGuest, currentItem, advanceCard, triggerStreak, recordSwipeInBackground, toast]
  );

  const handleToggleFavorite = useCallback(async (itemId: string) => {
    if (!user) {
      setShowGuestPrompt(true);
      return;
    }

    const queryKey = ["favorite-item-ids", user.id];
    const wasSaved = favoriteItemIdSet.has(itemId);
    queryClient.setQueryData<string[]>(queryKey, (current = []) => (
      wasSaved ? current.filter((id) => id !== itemId) : [...current, itemId]
    ));

    try {
      if (wasSaved) await removeFavorite(user.id, itemId);
      else await addFavorite(user.id, itemId);
      queryClient.invalidateQueries({ queryKey: ["my-favorites", user.id] });
    } catch {
      queryClient.setQueryData<string[]>(queryKey, (current = []) => (
        wasSaved ? [...current, itemId] : current.filter((id) => id !== itemId)
      ));
      toast({ title: "Não foi possível atualizar os itens salvos", variant: "destructive" });
    }
  }, [favoriteItemIdSet, queryClient, toast, user]);

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
          toast({ title: "Erro ao enviar proposta", description: getErrorMessage(err, "Não foi possível enviar a proposta."), variant: "destructive" });
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

  // The next card is rendered behind the active one. Preload only the first media
  // of the card after it, keeping swipe transitions responsive on slower networks.
  const afterNextItem = visibleItems[2] ?? null;
  const afterNextImage = afterNextItem?.item_images?.[0]?.image_url;

  useEffect(() => {
    preloadImage(afterNextImage ? cdnFull(afterNextImage) : null).catch(() => undefined);
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
        ) : feedEnded || visibleItems.length === 0 ? (
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
                        url: "https://app.hypou.app",
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
              {!filtersOpen && !showSelectItem && !showGuestPrompt && (
                <div
                  className="absolute right-4 z-[70] flex flex-col items-center gap-2"
                  style={{ top: "calc(var(--safe-area-top) + 0.75rem)" }}
                >
                  <button
                    type="button"
                    onClick={() => void handleToggleFavorite(currentItem.id)}
                    aria-label={favoriteItemIdSet.has(currentItem.id) ? "Remover dos itens salvos" : "Salvar item"}
                    className="h-9 w-9 rounded-full bg-scrim/45 backdrop-blur-xl border border-on-media/10 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Bookmark className={`h-3.5 w-3.5 ${favoriteItemIdSet.has(currentItem.id) ? "fill-primary text-primary" : "text-on-media"}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void shareContent({
                        title: `${currentItem.name} — Hypou`,
                        text: `Olha esse item no Hypou: ${currentItem.name} por ${formatValue(currentItem.market_value)}! Quer trocar?`,
                        url: buildPublicItemUrl(currentItem.id),
                      }).catch((error) => {
                        if (error?.name !== "AbortError") console.error("Falha ao compartilhar item", error);
                      });
                    }}
                    aria-label="Compartilhar item"
                    className="h-9 w-9 rounded-full bg-scrim/45 backdrop-blur-xl border border-on-media/10 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Share2 className="h-3.5 w-3.5 text-on-media" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(true)}
                    className="relative h-9 w-9 rounded-full bg-scrim/45 backdrop-blur-xl border border-on-media/10 flex items-center justify-center active:scale-95 transition-transform"
                    aria-label="Configurar interesses"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-on-media" />
                    {hasActiveFilters && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary ring-1 ring-scrim/70" />
                    )}
                  </button>
                </div>
              )}

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
                  key={nextItem.id}
                  item={nextItem}
                  onSwipeComplete={ignoreSwipeComplete}
                  standby
                  revealMotionX={dragDirectionValue}
                  matchedOwnItem={nextMatchedOwnItem}
                />
              )}

              {/* Active draggable card */}
              <SwipeCard
                key={currentItem.id}
                ref={cardRef}
                item={currentItem}
                onSwipeComplete={handleSwipeComplete}
                onDragDirectionChange={handleDragDirectionChange}
                disabled={swipingRef.current}
                matchedOwnItem={currentMatchedOwnItem}
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
                <button
                  type="button"
                  aria-pressed={allCategoriesSelected}
                  onClick={() =>
                    setExploreFilters((current) => ({
                      ...current,
                      categories: allCategoriesSelected ? [] : categories.map((category) => category.label),
                    }))
                  }
                  className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                    allCategoriesSelected ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Todos
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = exploreFilters.categories.includes(cat.label);
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      aria-pressed={selected}
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
