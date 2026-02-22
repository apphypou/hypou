import { Loader2, Sparkles, X, Zap, Heart } from "lucide-react";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getExploreItems } from "@/services/itemService";
import { createSwipe } from "@/services/swipeService";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import SwipeCard, { type SwipeCardHandle } from "@/components/SwipeCard";

const SUPERLIKE_PARTICLE_COUNT = 16;

const generateParticles = () =>
  Array.from({ length: SUPERLIKE_PARTICLE_COUNT }, (_, i) => ({
    id: i,
    angle: (360 / SUPERLIKE_PARTICLE_COUNT) * i + Math.random() * 20 - 10,
    distance: 80 + Math.random() * 100,
    size: 4 + Math.random() * 6,
    delay: Math.random() * 0.15,
    duration: 0.5 + Math.random() * 0.3,
  }));

const formatValue = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const Explorar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const swipingRef = useRef(false);
  const cardRef = useRef<SwipeCardHandle>(null);

  const [likeStreak, setLikeStreak] = useState(0);
  const [showStreak, setShowStreak] = useState(false);
  const [superlikeFlash, setSuperlikeFlash] = useState(false);
  const [particles, setParticles] = useState<ReturnType<typeof generateParticles>>([]);
  const streakTimeout = useRef<NodeJS.Timeout>();

  // Drag progress for stack animation
  const dragProgressValue = useMotionValue(0);
  const nextScale = useTransform(dragProgressValue, [0, 1], [0.93, 0.97]);
  const nextOpacity = useTransform(dragProgressValue, [0, 1], [0.4, 0.7]);
  const nextBlur = useTransform(dragProgressValue, [0, 1], [4, 1]);
  const nextBlurFilter = useTransform(nextBlur, (v) => `blur(${v}px)`);
  const thirdScale = useTransform(dragProgressValue, [0, 1], [0.88, 0.91]);
  const thirdOpacity = useTransform(dragProgressValue, [0, 1], [0.2, 0.3]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["explore-items", user?.id],
    queryFn: () => getExploreItems(user!.id),
    enabled: !!user,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (items.length > 0 && localItems.length === 0) {
      setLocalItems(items);
    }
  }, [items, localItems.length]);

  const currentItem = localItems[currentIndex];
  const nextItem = localItems[(currentIndex + 1) % localItems.length] ?? null;
  const thirdItem = localItems[(currentIndex + 2) % localItems.length] ?? null;

  const advanceCard = useCallback(() => {
    setEpoch((e) => e + 1);
    dragProgressValue.set(0);
    if (currentIndex + 1 >= localItems.length) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, localItems.length, dragProgressValue]);

  const triggerStreak = useCallback((direction: string) => {
    if (direction === "like" || direction === "superlike") {
      setLikeStreak((s) => {
        const next = s + 1;
        if (next >= 3) {
          setShowStreak(true);
          if (streakTimeout.current) clearTimeout(streakTimeout.current);
          streakTimeout.current = setTimeout(() => setShowStreak(false), 1500);
        }
        return next;
      });
    } else {
      setLikeStreak(0);
      setShowStreak(false);
    }
  }, []);

  // FASE 1: Fire-and-forget background API call
  const recordSwipeInBackground = useCallback(
    (direction: "like" | "dislike" | "superlike", itemId: string) => {
      if (!user) return;
      (async () => {
        try {
          await createSwipe(user.id, itemId, direction);
          if (direction === "like" || direction === "superlike") {
            const { supabase } = await import("@/integrations/supabase/client");
            const { data: newMatches } = await supabase
              .from("matches")
              .select("id, created_at")
              .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
              .order("created_at", { ascending: false })
              .limit(1);
            if (newMatches && newMatches.length > 0) {
              const matchAge = Date.now() - new Date(newMatches[0].created_at).getTime();
              if (matchAge < 5000) {
                navigate(`/match/${newMatches[0].id}`);
              }
            }
          }
        } catch (err: any) {
          if (!err.message?.includes("duplicate")) {
            toast({ title: "Erro ao registrar swipe", description: err.message, variant: "destructive" });
          }
        }
      })();
    },
    [user, navigate, toast]
  );

  // FASE 1: Optimistic transition — advance IMMEDIATELY, API in background
  const handleSwipeComplete = useCallback(
    (direction: "like" | "dislike" | "superlike") => {
      if (swipingRef.current || !user || !currentItem) return;
      swipingRef.current = true;

      triggerStreak(direction);
      const itemId = currentItem.id;

      // Advance card FIRST (instant transition)
      advanceCard();

      // Record swipe in background (fire-and-forget)
      recordSwipeInBackground(direction, itemId);

      swipingRef.current = false;
    },
    [user, currentItem, advanceCard, triggerStreak, recordSwipeInBackground]
  );

  // Superlike wrapper: flash + particles, then complete
  const handleSwipeCompleteWithEffects = useCallback(
    (direction: "like" | "dislike" | "superlike") => {
      if (direction === "superlike") {
        setSuperlikeFlash(true);
        setParticles(generateParticles());
        setTimeout(() => setSuperlikeFlash(false), 400);
        setTimeout(() => {
          handleSwipeComplete("superlike");
          setTimeout(() => setParticles([]), 600);
        }, 350);
      } else {
        handleSwipeComplete(direction);
      }
    },
    [handleSwipeComplete]
  );

  const handleDragProgressChange = useCallback(
    (progress: number) => {
      dragProgressValue.set(progress);
    },
    [dragProgressValue]
  );

  // FASE 1: Preload next image
  const nextImage = nextItem?.item_images?.[0]?.image_url;
  const thirdImage = thirdItem?.item_images?.[0]?.image_url;

  useEffect(() => {
    if (nextImage) {
      const img = new window.Image();
      img.src = nextImage;
    }
  }, [nextImage]);

  return (
    <ScreenLayout>
      {/* Header — safe-area-inset-top */}
      <header
        className="relative z-40 flex w-full justify-between items-center px-6 pb-4"
        style={{ paddingTop: "max(3rem, env(safe-area-inset-top))" }}
      >
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-0.5">
            Encontre Trocas
          </span>
          <h1 className="text-foreground text-xl font-extrabold tracking-tight">
            Explorar <span className="text-primary">Trocas</span>
          </h1>
        </div>
        <div />
      </header>

      {/* Main Card Area — extra pb for action buttons + BottomNav */}
      <main className="relative flex-1 flex flex-col items-center justify-start w-full px-5 pb-40 pt-2 z-10">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        ) : localItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <span className="text-6xl mb-4">🔍</span>
            <h2 className="text-xl font-bold text-foreground mb-2">Sem itens por agora</h2>
            <p className="text-muted-foreground text-sm">Volte mais tarde para encontrar novas trocas!</p>
          </div>
        ) : currentItem ? (
          <div className="relative w-full h-full max-h-[520px] flex flex-col" style={{ perspective: "1200px" }}>
            {/* Streak indicator — smoother animation */}
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

            {/* Superlike flash overlay */}
            <AnimatePresence>
              {superlikeFlash && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 z-50 rounded-[2.5rem] bg-primary pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Superlike particles */}
            <AnimatePresence>
              {particles.length > 0 && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                  {particles.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                      animate={{
                        opacity: 0,
                        scale: 0,
                        x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                        y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
                      className="absolute rounded-full"
                      style={{
                        width: p.size,
                        height: p.size,
                        background: `radial-gradient(circle, hsl(184 100% 70%), hsl(184 100% 50%))`,
                        boxShadow: `0 0 ${p.size * 2}px hsl(184 100% 50% / 0.8)`,
                      }}
                    />
                  ))}
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute w-8 h-8 rounded-full"
                    style={{
                      background: "radial-gradient(circle, hsl(184 100% 60% / 0.6), transparent)",
                    }}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Third card in stack — with text preview */}
            {localItems.length >= 3 && thirdItem && (
              <motion.div
                className="absolute inset-0 z-[-1] bg-muted rounded-[2.5rem] border border-foreground/5 overflow-hidden"
                style={{
                  scale: thirdScale,
                  opacity: thirdOpacity,
                  y: -25,
                  filter: "blur(4px)",
                }}
              >
                {thirdImage && (
                  <img src={thirdImage} alt="" className="w-full h-full object-cover object-center" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 z-10">
                  <p className="text-foreground/80 text-lg font-bold truncate">{thirdItem.name}</p>
                  <p className="text-primary/70 text-sm font-semibold">{formatValue(thirdItem.market_value)}</p>
                </div>
              </motion.div>
            )}

            {/* Second card (next item preview) — with text preview */}
            {localItems.length >= 2 && nextItem && (
              <motion.div
                className="absolute inset-0 z-0 bg-muted rounded-[2.5rem] border border-foreground/5 overflow-hidden"
                style={{
                  scale: nextScale,
                  opacity: nextOpacity,
                  y: -15,
                }}
              >
                {nextImage && (
                  <motion.img
                    src={nextImage}
                    alt=""
                    className="w-full h-full object-cover object-center"
                    style={{ filter: nextBlurFilter }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 z-10">
                  <p className="text-foreground/80 text-lg font-bold truncate">{nextItem.name}</p>
                  <p className="text-primary/70 text-sm font-semibold">{formatValue(nextItem.market_value)}</p>
                </div>
              </motion.div>
            )}

            {/* Main draggable card */}
            <SwipeCard
              key={`${currentItem.id}-${epoch}`}
              ref={cardRef}
              item={currentItem}
              onSwipeComplete={handleSwipeCompleteWithEffects}
              onDragProgressChange={handleDragProgressChange}
              disabled={swipingRef.current}
            />
          </div>
        ) : null}

        {/* Action Buttons — extracted from SwipeCard, fixed between card and BottomNav */}
        {currentItem && !isLoading && localItems.length > 0 && (
          <div className="w-full flex justify-center items-center gap-6 pt-5">
            <motion.button
              onClick={() => cardRef.current?.triggerSwipe("dislike")}
              className="flex items-center justify-center h-16 w-16 rounded-full bg-muted/80 border border-foreground/10 text-foreground/50 backdrop-blur-xl"
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.08, borderColor: "hsl(0 84% 60% / 0.5)" }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <X className="h-8 w-8" />
            </motion.button>
            <motion.button
              onClick={() => cardRef.current?.triggerSwipe("superlike")}
              className="flex items-center justify-center h-14 w-14 rounded-full bg-background border border-primary/40 text-primary neon-glow backdrop-blur-xl -translate-y-2"
              whileTap={{ scale: 0.8, rotate: 15 }}
              whileHover={{ scale: 1.15, boxShadow: "0 0 30px hsl(184 100% 50% / 0.5)" }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <Zap className="h-7 w-7" />
            </motion.button>
            <motion.button
              onClick={() => cardRef.current?.triggerSwipe("like")}
              className="flex items-center justify-center h-16 w-16 rounded-full bg-primary border border-primary/20 text-background shadow-xl"
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.08, boxShadow: "0 0 25px hsl(142 71% 45% / 0.4)" }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <Heart className="h-8 w-8" />
            </motion.button>
          </div>
        )}
      </main>

      <BottomNav activeTab="explorar" />
    </ScreenLayout>
  );
};

export default Explorar;
