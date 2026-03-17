import { Filter, Search, Share2, PlusCircle, Clapperboard, Heart, MapPin } from "lucide-react";
import { SkeletonSwipeCard } from "@/components/SkeletonCard";
import NotificationBell from "@/components/NotificationBell";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getExploreItems, getPublicExploreItems, getNearbyItems } from "@/services/itemService";
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
import { useGeolocation } from "@/hooks/useGeolocation";

const allCategories = [
  { emoji: "📱", label: "Celulares" },
  { emoji: "🚗", label: "Carros & Motos" },
  { emoji: "👕", label: "Moda" },
  { emoji: "🛋️", label: "Casa" },
  { emoji: "🎮", label: "Videogames" },
  { emoji: "💻", label: "Eletrônicos" },
  { emoji: "⚽", label: "Esportes" },
  { emoji: "📚", label: "Livros" },
  { emoji: "🎸", label: "Instrumentos" },
  { emoji: "🔧", label: "Ferramentas" },
  { emoji: "🐾", label: "Animais" },
  { emoji: "📦", label: "Outros" },
];

const distanceOptions = [
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "50 km", value: 50 },
  { label: "Todos", value: 0 },
];

const Explorar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isGuest = !user;

  // Onboarding guard: redirect logged-in users who haven't completed onboarding
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
  });

  useEffect(() => {
    if (user && onboardingProfile && !onboardingProfile.onboarding_completed) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, onboardingProfile, navigate]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const swipingRef = useRef(false);
  const cardRef = useRef<SwipeCardHandle>(null);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);

  const [likeStreak, setLikeStreak] = useState(0);
  const [showStreak, setShowStreak] = useState(false);

  // Category filter state
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Distance filter
  const [distanceFilter, setDistanceFilter] = useState(0); // 0 = all

  // Guest prompt
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  // SelectItemDialog state
  const [showSelectItem, setShowSelectItem] = useState(false);
  const [pendingLikeItem, setPendingLikeItem] = useState<any>(null);
  const [proposalLoading, setProposalLoading] = useState(false);

  // Geolocation
  const { position, requestLocation } = useGeolocation(user?.id);

  // Fetch user's preferred categories
  const { data: userCategories = [] } = useQuery({
    queryKey: ["user-categories", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_categories")
        .select("category")
        .eq("user_id", user!.id);
      return (data || []).map((c) => c.category);
    },
    enabled: !!user,
  });

  const dragDirectionValue = useMotionValue(0);

  // Fetch items — use nearby if distance filter + position, otherwise standard
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["explore-items", user?.id, distanceFilter, position?.lat, position?.lng],
    queryFn: async () => {
      if (distanceFilter > 0 && position) {
        return getNearbyItems(position.lat, position.lng, distanceFilter, user?.id || undefined);
      }
      if (user) {
        return getExploreItems(user.id);
      }
      return getPublicExploreItems();
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (items.length > 0) {
      setLocalItems(items);
    }
  }, [items]);

  // Filter items by active category
  const filteredItems = useMemo(() => {
    if (!activeFilter) return localItems;
    return localItems.filter((item) => item.category === activeFilter);
  }, [localItems, activeFilter]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setEpoch((e) => e + 1);
    dragDirectionValue.set(0);
  }, [activeFilter, dragDirectionValue]);

  const currentItem = filteredItems[currentIndex];
  const nextItem = filteredItems[currentIndex + 1] ?? (filteredItems.length > 1 ? filteredItems[0] : null);

  const advanceCard = useCallback(() => {
    setPrevIndex(currentIndex);
    setEpoch((e) => e + 1);
    dragDirectionValue.set(0);
    if (currentIndex + 1 >= filteredItems.length) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, filteredItems.length, dragDirectionValue]);

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
        // Guest can swipe dislike freely
        advanceCard();
        swipingRef.current = false;
        return;
      }

      triggerStreak(direction);

      if (direction === "like") {
        recordSwipeInBackground("like", currentItem.id);
        if (navigator.vibrate) navigator.vibrate(50);
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
    async (myItemId: string) => {
      if (!user || !pendingLikeItem) return;
      setProposalLoading(true);
      try {
        await createProposal(user.id, myItemId, pendingLikeItem.id, pendingLikeItem.user_id);
        toast({ title: "🤝 Proposta enviada!", description: `Proposta de troca enviada com sucesso.` });
      } catch (err: any) {
        if (err.message?.includes("duplicate")) {
          toast({ title: "Proposta já existe", description: "Você já enviou uma proposta para este item." });
        } else {
          toast({ title: "Erro ao enviar proposta", description: err.message, variant: "destructive" });
        }
      } finally {
        setProposalLoading(false);
        setShowSelectItem(false);
        setPendingLikeItem(null);
      }
    },
    [user, pendingLikeItem, toast]
  );

  const handleDragDirectionChange = useCallback(
    (rawX: number) => {
      dragDirectionValue.set(rawX);
    },
    [dragDirectionValue]
  );

  const handleDistanceChange = (km: number) => {
    if (km > 0 && !position) {
      requestLocation();
    }
    setDistanceFilter(km);
    setLocalItems([]);
    setCurrentIndex(0);
    setEpoch((e) => e + 1);
  };

  // Preload image after next
  const afterNextItem = filteredItems[currentIndex + 2] ?? filteredItems[0] ?? null;
  const afterNextImage = afterNextItem?.item_images?.[0]?.image_url;

  useEffect(() => {
    if (afterNextImage) {
      const img = new window.Image();
      img.src = afterNextImage;
    }
  }, [afterNextImage]);

  const progressText = filteredItems.length > 0
    ? `${Math.min(currentIndex + 1, filteredItems.length)}/${filteredItems.length}`
    : "";

  return (
    <ScreenLayout>
      {/* Compact header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-6 pb-2 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-0.5">
            Descubra
          </span>
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
            Explorar
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isGuest && (
            <button
              onClick={() => navigate("/busca")}
              className="h-9 w-9 rounded-full flex items-center justify-center bg-card border border-foreground/10 text-foreground/50 hover:text-foreground transition-all"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
          {!isGuest && <NotificationBell />}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
              showFilters || activeFilter || distanceFilter > 0 ? "bg-primary text-primary-foreground" : "bg-card border border-foreground/10 text-foreground/50"
            }`}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Category + Distance filter chips */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-6 shrink-0 z-30"
          >
            {/* Distance chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-1" />
              {distanceOptions.map((d) => (
                <button
                  key={d.value}
                  onClick={() => handleDistanceChange(d.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    distanceFilter === d.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-foreground/10 text-foreground/50"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
              <button
                onClick={() => setActiveFilter(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  !activeFilter
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-foreground/10 text-foreground/50"
                }`}
              >
                Todos
              </button>
              {allCategories.map((cat) => {
                const isUserPref = userCategories.includes(cat.label);
                return (
                  <button
                    key={cat.label}
                    onClick={() => setActiveFilter(activeFilter === cat.label ? null : cat.label)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      activeFilter === cat.label
                        ? "bg-primary text-primary-foreground"
                        : isUserPref
                        ? "bg-primary/10 border border-primary/30 text-primary"
                        : "bg-card border border-foreground/10 text-foreground/50"
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Card Area */}
      <main className="relative flex-1 flex flex-col items-center justify-start w-full px-4 pb-36 pt-1 z-10 overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center w-full">
            <SkeletonSwipeCard />
          </div>
        ) : filteredItems.length === 0 ? (
          /* ===== EMPTY STATE ===== */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <motion.span
              className="text-7xl mb-5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {activeFilter ? "🔍" : "🤷‍♂️"}
            </motion.span>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {activeFilter ? `Sem itens em "${activeFilter}"` : "Ainda não há itens por aqui"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              {activeFilter
                ? "Tente outra categoria ou remova o filtro."
                : isGuest
                ? "Crie sua conta e seja o primeiro a cadastrar um item!"
                : "Seja o primeiro a cadastrar um item ou convide amigos!"}
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              {activeFilter && (
                <button
                  onClick={() => setActiveFilter(null)}
                  className="w-full py-3 rounded-full bg-card border border-foreground/10 text-foreground text-sm font-bold uppercase tracking-wider hover:bg-card/80 transition-all flex items-center justify-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Limpar filtro
                </button>
              )}

              {isGuest ? (
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
                    onClick={() => navigate("/shorts")}
                    className="w-full py-3 rounded-full bg-card border border-foreground/10 text-foreground text-sm font-bold uppercase tracking-wider hover:bg-card/80 transition-all flex items-center justify-center gap-2"
                  >
                    <Clapperboard className="h-4 w-4" />
                    Explorar a Vitrine
                  </button>

                  {typeof navigator.share === "function" && (
                    <button
                      onClick={() => {
                        navigator.share({
                          title: "Hypou — Troque seus itens",
                          text: "Conheça o Hypou, o app de trocas inteligentes!",
                          url: "https://hypou.lovable.app",
                        }).catch(() => {});
                      }}
                      className="w-full py-3 rounded-full bg-card border border-foreground/10 text-foreground text-sm font-bold uppercase tracking-wider hover:bg-card/80 transition-all flex items-center justify-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Convidar amigos
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : currentItem ? (
          <>
            <div className="relative w-full h-full shrink-0">
              {/* Distance badge */}
              {currentItem.distance_km != null && (
                <div className="absolute top-2 left-2 z-50 flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-md border border-foreground/10 text-xs font-semibold text-foreground">
                  <MapPin className="h-3 w-3 text-primary" />
                  {currentItem.distance_km} km
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
                  key={`standby-${nextItem.id}`}
                  item={nextItem}
                  onSwipeComplete={() => {}}
                  standby
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
              />
            </div>
          </>
        ) : null}
      </main>

      {/* Toggle Switch */}
      {currentItem && !isLoading && filteredItems.length > 0 && (
        <div
          className="fixed left-0 right-0 z-40 flex justify-center items-center py-3"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)" }}
        >
          <SwipeToggle
            key={`toggle-${epoch}`}
            onSwipe={handleSwipeComplete}
            dragProgress={dragDirectionValue}
            disabled={swipingRef.current}
          />
        </div>
      )}

      <BottomNav activeTab="explorar" />

      {/* Guest prompt dialog */}
      <GuestPromptDialog
        open={showGuestPrompt}
        onClose={() => setShowGuestPrompt(false)}
      />

      {/* Select item dialog (authenticated only) */}
      {!isGuest && (
        <SelectItemDialog
          open={showSelectItem}
          onClose={() => { setShowSelectItem(false); setPendingLikeItem(null); }}
          onConfirm={handleProposalConfirm}
          targetItemName={pendingLikeItem?.name}
          loading={proposalLoading}
        />
      )}
    </ScreenLayout>
  );
};

export default Explorar;
