import { Loader2, X, Check } from "lucide-react";
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
  const [prevIndex, setPrevIndex] = useState<number | null>(null);

  const [likeStreak, setLikeStreak] = useState(0);
  const [showStreak, setShowStreak] = useState(false);

  // Drag progress (0-1 absolute) for stack animation
  const dragProgressValue = useMotionValue(0);

  // Raw drag direction value (negative = left, positive = right)
  const dragDirectionValue = useMotionValue(0);

  // Stack card 1 (next): scale 0.95→1.0, opacity 1→1, y 10→0
  const nextScale = useTransform(dragProgressValue, [0, 1], [0.95, 1.0]);
  const nextY = useTransform(dragProgressValue, [0, 1], [10, 0]);

  // Stack card 2 (background): scale 0.90→0.95, opacity 0.5→1.0, y 20→10
  const thirdScale = useTransform(dragProgressValue, [0, 1], [0.90, 0.95]);
  const thirdOpacity = useTransform(dragProgressValue, [0, 1], [0.5, 1.0]);
  const thirdY = useTransform(dragProgressValue, [0, 1], [20, 10]);

  // Reactive action buttons linked to drag direction
  const likeButtonScale = useTransform(dragDirectionValue, [0, 120], [1, 1.3]);
  const likeButtonGlow = useTransform(
    dragDirectionValue,
    [0, 60, 150],
    ["0px 0px 0px hsl(142 71% 45% / 0)", "0px 0px 12px hsl(142 71% 45% / 0.3)", "0px 0px 24px hsl(142 71% 45% / 0.6)"]
  );
  const dislikeButtonScale = useTransform(dragDirectionValue, [0, -120], [1, 1.3]);
  const dislikeButtonGlow = useTransform(
    dragDirectionValue,
    [0, -60, -150],
    ["0px 0px 0px hsl(0 84% 60% / 0)", "0px 0px 12px hsl(0 84% 60% / 0.3)", "0px 0px 24px hsl(0 84% 60% / 0.6)"]
  );

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
    setPrevIndex(currentIndex);
    setEpoch((e) => e + 1);
    dragProgressValue.set(0);
    dragDirectionValue.set(0);
    if (currentIndex + 1 >= localItems.length) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, localItems.length, dragProgressValue, dragDirectionValue]);

  const handleUndo = useCallback(() => {
    if (prevIndex === null) return;
    setCurrentIndex(prevIndex);
    setPrevIndex(null);
    setEpoch((e) => e + 1);
    dragProgressValue.set(0);
    dragDirectionValue.set(0);
  }, [prevIndex, dragProgressValue, dragDirectionValue]);

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

  // Fire-and-forget background API call
  const recordSwipeInBackground = useCallback(
    (direction: "like" | "dislike", itemId: string) => {
      if (!user) return;
      (async () => {
        try {
          await createSwipe(user.id, itemId, direction);
          if (direction === "like") {
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

  const handleSwipeComplete = useCallback(
    (direction: "like" | "dislike") => {
      if (swipingRef.current || !user || !currentItem) return;
      swipingRef.current = true;

      triggerStreak(direction);
      const itemId = currentItem.id;

      // Haptic feedback on like
      if (direction === "like" && navigator.vibrate) {
        navigator.vibrate(50);
      }

      advanceCard();
      recordSwipeInBackground(direction, itemId);

      swipingRef.current = false;
    },
    [user, currentItem, advanceCard, triggerStreak, recordSwipeInBackground]
  );

  const handleDragProgressChange = useCallback(
    (progress: number) => {
      dragProgressValue.set(progress);
    },
    [dragProgressValue]
  );

  const handleDragDirectionChange = useCallback(
    (rawX: number) => {
      dragDirectionValue.set(rawX);
    },
    [dragDirectionValue]
  );

  // Preload next image
  const nextImage = nextItem?.item_images?.[0]?.image_url;
  const thirdImage = thirdItem?.item_images?.[0]?.image_url;

  useEffect(() => {
    if (nextImage) {
      const img = new window.Image();
      img.src = nextImage;
    }
  }, [nextImage]);

  const progressText = localItems.length > 0
    ? `${Math.min(currentIndex + 1, localItems.length)}/${localItems.length}`
    : "";

  return (
    <ScreenLayout>
      {/* Compact header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-12 pb-4 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-0.5">
            Descubra
          </span>
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
            Explorar
          </h1>
        </div>
        {progressText && (
          <span className="text-foreground/30 text-xs font-bold tabular-nums tracking-wider">
            {progressText}
          </span>
        )}
      </header>

      {/* Main Card Area */}
      <main className="relative flex-1 flex flex-col items-center justify-start w-full px-4 pb-36 pt-1 z-10">
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
          <div className="relative w-full h-full flex flex-col">
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

            {/* Third card in stack — z:8, scale:0.90, y:20, opacity:0.5 */}
            {localItems.length >= 3 && thirdItem && (
              <motion.div
                className="absolute inset-0 bg-card dark:bg-muted rounded-[2.5rem] border-2 border-border/60 dark:border-foreground/8 overflow-hidden flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-none"
                style={{
                  scale: thirdScale,
                  opacity: thirdOpacity,
                  y: thirdY,
                  zIndex: 8,
                }}
              >
                <div className="w-full flex-[3] min-h-0 overflow-hidden">
                  {thirdImage && (
                    <img src={thirdImage} alt="" className="w-full h-full object-cover object-center" />
                  )}
                </div>
                <div className="w-full flex-[2] bg-card dark:bg-muted p-5 space-y-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-[0.1em] uppercase">{thirdItem.category}</span>
                  <p className="text-foreground text-xl font-bold tracking-tight leading-tight truncate">{thirdItem.name}</p>
                  <span className="block text-primary text-2xl font-extrabold tracking-tighter">{formatValue(thirdItem.market_value)}</span>
                </div>
              </motion.div>
            )}

            {/* Second card (next) — FULL SwipeCard pre-rendered behind active */}
            {localItems.length >= 2 && nextItem && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  zIndex: 9,
                }}
              >
                {/* Decorative border shell that scales with drag */}
                <motion.div
                  className="absolute inset-0 rounded-[2.5rem] border-2 border-border/80 dark:border-foreground/10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-none"
                  style={{
                    scale: nextScale,
                    y: nextY,
                  }}
                />
                {/* Full SwipeCard at 1:1 scale — no transform, so zero visual shift on promotion */}
                <div className="w-full h-full overflow-hidden rounded-[2.5rem]">
                  <SwipeCard
                    key={`next-${nextItem.id}`}
                    item={nextItem}
                    onSwipeComplete={() => {}}
                    disabled
                  />
                </div>
              </motion.div>
            )}

            {/* Main draggable card — z:10 */}
            <SwipeCard
              key={`${currentItem.id}-${epoch}`}
              ref={cardRef}
              item={currentItem}
              onSwipeComplete={handleSwipeComplete}
              onDragProgressChange={handleDragProgressChange}
              onDragDirectionChange={handleDragDirectionChange}
              disabled={swipingRef.current}
            />
          </div>
        ) : null}
      </main>

      {/* Action Buttons — pill style, reactive to drag */}
      {currentItem && !isLoading && localItems.length > 0 && (
        <div
          className="fixed left-0 right-0 z-40 flex justify-center items-center py-3"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)" }}
        >
          <div className="flex items-center bg-card dark:bg-muted rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-border/50 dark:border-foreground/5 p-1.5 gap-1">
            {/* Dislike button */}
            <motion.button
              onClick={() => cardRef.current?.triggerSwipe("dislike")}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              style={{ scale: dislikeButtonScale }}
              className="relative"
            >
              <motion.div
                className="flex items-center justify-center h-14 w-14 rounded-full bg-card dark:bg-muted"
                style={{ boxShadow: dislikeButtonGlow }}
              >
                <X className="h-6 w-6 text-[hsl(15,90%,55%)]" strokeWidth={3} />
              </motion.div>
            </motion.button>

            {/* Divider */}
            <div className="w-px h-8 bg-border/40 dark:bg-foreground/10" />

            {/* Like button */}
            <motion.button
              onClick={() => cardRef.current?.triggerSwipe("like")}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              style={{ scale: likeButtonScale }}
              className="relative"
            >
              <motion.div
                className="flex items-center justify-center h-14 w-14 rounded-full bg-card dark:bg-muted"
                style={{ boxShadow: likeButtonGlow }}
              >
                <Check className="h-6 w-6 text-[hsl(142,71%,45%)]" strokeWidth={3} />
              </motion.div>
            </motion.button>
          </div>
        </div>
      )}

      <BottomNav activeTab="explorar" />
    </ScreenLayout>
  );
};

export default Explorar;
