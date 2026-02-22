import { Loader2, Sparkles } from "lucide-react";
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

const Explorar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [epoch, setEpoch] = useState(0); // Fix Bug 2: unique key per swipe
  const [localItems, setLocalItems] = useState<any[]>([]); // Fix Bug 1: stable local list
  const swipingRef = useRef(false); // Fix Bug 5: synchronous swiping flag
  const cardRef = useRef<SwipeCardHandle>(null);

  const [likeStreak, setLikeStreak] = useState(0);
  const [showStreak, setShowStreak] = useState(false);
  const [superlikeFlash, setSuperlikeFlash] = useState(false);
  const [particles, setParticles] = useState<ReturnType<typeof generateParticles>>([]);
  const streakTimeout = useRef<NodeJS.Timeout>();

  // Drag progress for stack animation (driven by SwipeCard callback)
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

  // Fix Bug 1: populate localItems once from query, never refetch automatically
  useEffect(() => {
    if (items.length > 0 && localItems.length === 0) {
      setLocalItems(items);
    }
  }, [items, localItems.length]);

  const currentItem = localItems[currentIndex];
  const nextItem = localItems[(currentIndex + 1) % localItems.length] ?? null;
  const thirdItem = localItems[(currentIndex + 2) % localItems.length] ?? null;

  // Fix Bug 3 & 4: advanceCard just increments — no x.set, no setTimeout
  const advanceCard = useCallback(() => {
    setEpoch((e) => e + 1); // Fix Bug 2
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

  // Fix Bug 4 & 6: called by SwipeCard's onAnimationComplete — no setTimeout, no stale closure
  const handleSwipeComplete = useCallback(
    async (direction: "like" | "dislike" | "superlike") => {
      // Fix Bug 5: synchronous check
      if (swipingRef.current || !user || !currentItem) return;
      swipingRef.current = true;

      triggerStreak(direction);

      try {
        await createSwipe(user.id, currentItem.id, direction);

        // Fix Bug 7: only check matches for likes/superlikes
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
              advanceCard();
              navigate(`/match/${newMatches[0].id}`);
              return;
            }
          }
        }

        advanceCard();
      } catch (err: any) {
        if (!err.message?.includes("duplicate")) {
          toast({ title: "Erro ao registrar swipe", description: err.message, variant: "destructive" });
        }
        advanceCard();
      } finally {
        swipingRef.current = false;
      }
    },
    [user, currentItem, advanceCard, navigate, toast, triggerStreak]
  );

  // Superlike wrapper: flash + particles, then complete
  const handleSwipeCompleteWithEffects = useCallback(
    (direction: "like" | "dislike" | "superlike") => {
      if (direction === "superlike") {
        setSuperlikeFlash(true);
        setParticles(generateParticles());
        setTimeout(() => setSuperlikeFlash(false), 400);
        // Small delay for visual effect, then process
        setTimeout(() => {
          handleSwipeComplete("superlike").finally(() => setParticles([]));
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

  const formatValue = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  const nextImage = nextItem?.item_images?.[0]?.image_url;
  const thirdImage = thirdItem?.item_images?.[0]?.image_url;

  return (
    <ScreenLayout>
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-12 pb-4">
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

      {/* Main Card Area */}
      <main className="relative flex-1 flex flex-col items-center justify-start w-full px-5 pb-8 pt-2 z-10">
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
          <div className="relative w-full h-full max-h-[580px] flex flex-col" style={{ perspective: "1200px" }}>
            {/* Streak indicator */}
            <AnimatePresence>
              {showStreak && likeStreak >= 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
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

            {/* Third card in stack */}
            {localItems.length >= 3 && (
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
                  <img src={thirdImage} alt="" className="w-full h-full object-cover" />
                )}
              </motion.div>
            )}

            {/* Second card (next item preview) */}
            {localItems.length >= 2 && (
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
                    className="w-full h-full object-cover"
                    style={{ filter: nextBlurFilter }}
                  />
                )}
              </motion.div>
            )}

            {/* Main draggable card — Fix Bug 2: epoch key, Fix Bug 3: own motion values */}
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
      </main>

      <BottomNav activeTab="explorar" />
    </ScreenLayout>
  );
};

export default Explorar;
