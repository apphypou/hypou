import { PlusCircle, Share2 } from "lucide-react";
import emptyChestImg from "@/assets/empty-chest.png";
import { SkeletonSwipeCard } from "@/components/SkeletonCard";
import NotificationBell from "@/components/NotificationBell";
import ScreenLayout from "@/components/ScreenLayout";
import OnboardingTour from "@/components/OnboardingTour";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getRecommendedItems, getPublicExploreItems } from "@/services/itemService";
import { createSwipe } from "@/services/swipeService";
import { createProposal } from "@/services/matchService";
import { useState, useCallback, useRef, useEffect } from "react";
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

const Explorar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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
  });

  useEffect(() => {
    if (user && onboardingProfile && !onboardingProfile.onboarding_completed) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, onboardingProfile, navigate]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const swipingRef = useRef(false);
  const cardRef = useRef<SwipeCardHandle>(null);

  const [likeStreak, setLikeStreak] = useState(0);
  const [showStreak, setShowStreak] = useState(false);

  // Guest prompt
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  // SelectItemDialog state
  const [showSelectItem, setShowSelectItem] = useState(false);
  const [pendingLikeItem, setPendingLikeItem] = useState<any>(null);
  const [proposalLoading, setProposalLoading] = useState(false);

  const dragDirectionValue = useMotionValue(0);

  // Fetch items — recommended for logged-in, public for guests
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["explore-items", user?.id],
    queryFn: async () => {
      if (user) {
        return getRecommendedItems(user.id);
      }
      return getPublicExploreItems();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const currentItem = items[currentIndex] ?? null;
  const nextItem = items[currentIndex + 1] ?? null;

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

  // Preload image after next
  const afterNextItem = items[currentIndex + 2] ?? null;
  const afterNextImage = afterNextItem?.item_images?.[0]?.image_url;

  useEffect(() => {
    if (afterNextImage) {
      const img = new window.Image();
      img.src = afterNextImage;
    }
  }, [afterNextImage]);

  const feedEnded = !isLoading && currentIndex >= items.length;

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
          {!isGuest && <NotificationBell />}
        </div>
      </header>

      {/* Main Card Area */}
      <main className="relative flex-1 flex flex-col items-center justify-start w-full px-4 pb-36 pt-1 z-10 overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center w-full">
            <SkeletonSwipeCard />
          </div>
        ) : feedEnded || items.length === 0 ? (
          /* ===== EMPTY STATE ===== */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <motion.div
              className="mb-5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {items.length === 0 ? (
                <img src={emptyChestImg} alt="Baú vazio" className="w-48 h-48 object-contain" />
              ) : (
                <span className="text-7xl">✅</span>
              )}
            </motion.div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {items.length === 0
                ? "Ainda não há itens por aqui"
                : "Você já viu tudo!"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              {items.length === 0
                ? isGuest
                  ? "Crie sua conta e seja o primeiro a cadastrar um item!"
                  : "Seja o primeiro a cadastrar um item ou convide amigos!"
                : "Cadastre mais itens para ampliar suas possibilidades de troca."}
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
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
                matchedOwnItem={currentItem.matched_own_item ? { ...currentItem.matched_own_item, count: currentItem.matched_items_count } : null}
              />
            </div>
          </>
        ) : null}
      </main>

      {/* Toggle Switch */}
      {currentItem && !isLoading && !feedEnded && (
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

      {/* Onboarding Tour for first-time users */}
      {!isGuest && <OnboardingTour />}

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
