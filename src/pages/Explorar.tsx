import { Loader2, X, Heart, Undo2 } from "lucide-react";
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
    setPrevIndex(currentIndex);
    setEpoch((e) => e + 1);
    dragProgressValue.set(0);
    if (currentIndex + 1 >= localItems.length) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, localItems.length, dragProgressValue]);

  const handleUndo = useCallback(() => {
    if (prevIndex === null) return;
    setCurrentIndex(prevIndex);
    setPrevIndex(null);
    setEpoch((e) => e + 1);
    dragProgressValue.set(0);
  }, [prevIndex, dragProgressValue]);

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
      <header
        className="relative z-40 flex w-full justify-between items-center px-6 pb-2"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}
      >
        <h1 className="text-foreground text-lg font-extrabold tracking-tight">
          Explorar
        </h1>
        {progressText && (
          <span className="text-foreground/30 text-xs font-bold tabular-nums tracking-wider">
            {progressText}
          </span>
        )}
      </header>

      {/* Main Card Area */}
      <main className="relative flex-1 flex flex-col items-center justify-start w-full px-4 pb-2 pt-1 z-10">
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
          <div className="relative w-full h-full flex flex-col" style={{ perspective: "1200px" }}>
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

            {/* Third card in stack */}
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

            {/* Second card (next item preview) */}
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
              onSwipeComplete={handleSwipeComplete}
              onDragProgressChange={handleDragProgressChange}
              disabled={swipingRef.current}
            />
          </div>
        ) : null}
      </main>

      {/* Fade gradient behind action buttons */}
      {currentItem && !isLoading && localItems.length > 0 && (
        <div
          className="fixed left-0 right-0 z-30 pointer-events-none"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)", height: "8rem" }}
        >
          <div className="w-full h-full bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
      )}

      {/* Action Buttons — fixed above BottomNav */}
      {currentItem && !isLoading && localItems.length > 0 && (
        <div
          className="fixed left-0 right-0 z-40 flex justify-center items-center gap-8 py-3"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)" }}
        >
          <motion.button
            onClick={() => cardRef.current?.triggerSwipe("dislike")}
            className="flex flex-col items-center gap-1"
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted/80 border border-foreground/10 text-foreground/50 backdrop-blur-xl">
              <X className="h-7 w-7" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/40">Passar</span>
          </motion.button>

          {/* Undo button — smaller, between the two */}
          <motion.button
            onClick={handleUndo}
            className="flex flex-col items-center gap-1"
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            style={{ opacity: prevIndex !== null ? 1 : 0.25 }}
            disabled={prevIndex === null}
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted/60 border border-foreground/10 text-foreground/40 backdrop-blur-xl">
              <Undo2 className="h-5 w-5" />
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider text-foreground/30">Voltar</span>
          </motion.button>

          <motion.button
            onClick={() => cardRef.current?.triggerSwipe("like")}
            className="flex flex-col items-center gap-1"
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary border border-primary/20 text-background shadow-xl">
              <Heart className="h-7 w-7" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary/70">Hypou</span>
          </motion.button>
        </div>
      )}

      <BottomNav activeTab="explorar" />
    </ScreenLayout>
  );
};

export default Explorar;
