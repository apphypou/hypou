import { X, Zap, Heart, MapPin, Image, Loader2, Sparkles } from "lucide-react";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getExploreItems } from "@/services/itemService";
import { createSwipe } from "@/services/swipeService";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  PanInfo,
  AnimatePresence,
  useSpring,
} from "framer-motion";

const SWIPE_THRESHOLD = 80;
const SUPERLIKE_PARTICLE_COUNT = 16;

// Generate random particles for superlike burst
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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [likeStreak, setLikeStreak] = useState(0);
  const [showStreak, setShowStreak] = useState(false);
  const [superlikeFlash, setSuperlikeFlash] = useState(false);
  const [particles, setParticles] = useState<ReturnType<typeof generateParticles>>([]);
  const streakTimeout = useRef<NodeJS.Timeout>();

  // Motion values
  const x = useMotionValue(0);
  const rawRotate = useTransform(x, [-300, 300], [-18, 18]);
  const rotate = useSpring(rawRotate, { stiffness: 300, damping: 30 });

  // Like/dislike overlays
  const likeOpacity = useTransform(x, [0, 80], [0, 1]);
  const dislikeOpacity = useTransform(x, [-80, 0], [1, 0]);

  // Glow border colors — smooth transition based on drag
  const likeGlowOpacity = useTransform(x, [0, 60, 120], [0, 0.3, 0.8]);
  const dislikeGlowOpacity = useTransform(x, [-120, -60, 0], [0.8, 0.3, 0]);

  // Card tilt for 3D effect
  const rotateY = useTransform(x, [-200, 200], [-8, 8]);

  // Parallax — image moves opposite to drag
  const imageX = useTransform(x, [-200, 200], [30, -30]);

  // Next card reacts to drag — scales up as current card moves away
  const dragProgress = useTransform(x, [-200, 0, 200], [1, 0, 1]);
  const nextScale = useTransform(dragProgress, [0, 1], [0.93, 0.97]);
  const nextOpacity = useTransform(dragProgress, [0, 1], [0.4, 0.7]);
  const nextBlur = useTransform(dragProgress, [0, 1], [4, 1]);

  // Third card in stack
  const thirdScale = useTransform(dragProgress, [0, 1], [0.88, 0.91]);
  const thirdOpacity = useTransform(dragProgress, [0, 1], [0.2, 0.3]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["explore-items", user?.id],
    queryFn: () => getExploreItems(user!.id),
    enabled: !!user,
  });

  const currentItem = items[currentIndex];
  const nextItem = items[currentIndex + 1];
  const thirdItem = items[currentIndex + 2];

  const advanceCard = useCallback(() => {
    if (currentIndex + 1 >= items.length) {
      queryClient.invalidateQueries({ queryKey: ["explore-items"] });
      setCurrentIndex(0);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, items.length, queryClient]);

  // Streak logic
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

  const handleSwipe = useCallback(
    async (direction: "like" | "dislike" | "superlike") => {
      if (!user || !currentItem || swiping) return;
      setSwiping(true);
      triggerStreak(direction);
      try {
        await createSwipe(user.id, currentItem.id, direction);

        const { supabase } = await import("@/integrations/supabase/client");
        const { data: newMatches } = await supabase
          .from("matches")
          .select("id")
          .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(1);

        advanceCard();

        if (newMatches && newMatches.length > 0) {
          const { data: recentMatch } = await supabase
            .from("matches")
            .select("id, created_at")
            .eq("id", newMatches[0].id)
            .single();

          if (recentMatch) {
            const matchAge = Date.now() - new Date(recentMatch.created_at).getTime();
            if (matchAge < 5000) {
              navigate(`/match/${recentMatch.id}`);
              return;
            }
          }
        }
      } catch (err: any) {
        if (!err.message?.includes("duplicate")) {
          toast({ title: "Erro ao registrar swipe", description: err.message, variant: "destructive" });
        }
        advanceCard();
      } finally {
        setSwiping(false);
      }
    },
    [user, currentItem, swiping, advanceCard, navigate, toast, triggerStreak]
  );

  const performSwipe = useCallback(
    (direction: "like" | "dislike" | "superlike", exitX: number) => {
      if (swiping) return;

      if (direction === "superlike") {
        // Superlike: flash + particles + card flies up
        setSuperlikeFlash(true);
        setParticles(generateParticles());
        setTimeout(() => setSuperlikeFlash(false), 400);
        animate(x, 0, { duration: 0.1 });
        setTimeout(() => {
          handleSwipe("superlike").finally(() => {
            setParticles([]);
          });
        }, 350);
      } else {
        // Animate card off screen with spring
        animate(x, exitX, {
          type: "spring",
          stiffness: 600,
          damping: 40,
          velocity: exitX > 0 ? 800 : -800,
        });
        setTimeout(() => {
          handleSwipe(direction);
        }, 200);
      }
    },
    [handleSwipe, swiping, x]
  );

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      const velocity = info.velocity.x;
      const offset = info.offset.x;

      // Allow velocity-based swipes for snappier feel
      if (offset > SWIPE_THRESHOLD || velocity > 500) {
        performSwipe("like", 600);
      } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
        performSwipe("dislike", -600);
      } else {
        // Rubber-band bounce back
        animate(x, 0, {
          type: "spring",
          stiffness: 800,
          damping: 25,
          mass: 0.5,
        });
      }
    },
    [performSwipe, x]
  );

  const handleButtonSwipe = useCallback(
    (direction: "like" | "dislike" | "superlike") => {
      performSwipe(direction, direction === "dislike" ? -600 : 600);
    },
    [performSwipe]
  );

  const formatValue = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  const mainImage = currentItem?.item_images?.[0]?.image_url;
  const imageCount = currentItem?.item_images?.length || 0;
  const ownerProfile = currentItem?.profiles as any;
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
        ) : !currentItem ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <span className="text-6xl mb-4">🔍</span>
            <h2 className="text-xl font-bold text-foreground mb-2">Sem itens por agora</h2>
            <p className="text-muted-foreground text-sm">Volte mais tarde para encontrar novas trocas!</p>
          </div>
        ) : (
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
                      transition={{
                        duration: p.duration,
                        delay: p.delay,
                        ease: "easeOut",
                      }}
                      className="absolute rounded-full"
                      style={{
                        width: p.size,
                        height: p.size,
                        background: `radial-gradient(circle, hsl(184 100% 70%), hsl(184 100% 50%))`,
                        boxShadow: `0 0 ${p.size * 2}px hsl(184 100% 50% / 0.8)`,
                      }}
                    />
                  ))}
                  {/* Central burst */}
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

            {/* Third card in stack (deepest) */}
            {thirdItem && (
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

            {/* Second card (next item preview) — reacts to drag */}
            {nextItem && (
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
                    style={{ filter: useTransform(nextBlur, (v) => `blur(${v}px)`) }}
                  />
                )}
              </motion.div>
            )}

            {/* Main draggable card */}
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentItem.id}
                className="relative z-10 flex-1 w-full bg-muted rounded-[2.5rem] overflow-hidden flex flex-col swipe-card touch-none"
                style={{
                  x,
                  rotate,
                  rotateY,
                  transformStyle: "preserve-3d",
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.9}
                onDragEnd={handleDragEnd}
                initial={{ scale: 0.92, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -50, transition: { duration: 0.2 } }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 28,
                  mass: 0.8,
                }}
              >
                {/* Dynamic glow borders */}
                <motion.div
                  className="absolute inset-0 z-40 rounded-[2.5rem] pointer-events-none"
                  style={{
                    opacity: likeGlowOpacity,
                    boxShadow: "inset 0 0 40px hsl(142 71% 45% / 0.4), 0 0 30px hsl(142 71% 45% / 0.3)",
                    border: "2px solid hsl(142 71% 45% / 0.6)",
                  }}
                />
                <motion.div
                  className="absolute inset-0 z-40 rounded-[2.5rem] pointer-events-none"
                  style={{
                    opacity: dislikeGlowOpacity,
                    boxShadow: "inset 0 0 40px hsl(0 84% 60% / 0.4), 0 0 30px hsl(0 84% 60% / 0.3)",
                    border: "2px solid hsl(0 84% 60% / 0.6)",
                  }}
                />

                {/* Like/Dislike stamp overlays */}
                <motion.div
                  className="absolute inset-0 z-30 rounded-[2.5rem] pointer-events-none flex items-center justify-center"
                  style={{ opacity: likeOpacity }}
                >
                  <motion.span
                    className="text-success text-5xl font-black rotate-[-15deg] border-4 border-success px-4 py-2 rounded-xl"
                    style={{
                      textShadow: "0 0 20px hsl(142 71% 45% / 0.6)",
                    }}
                  >
                    LIKE
                  </motion.span>
                </motion.div>
                <motion.div
                  className="absolute inset-0 z-30 rounded-[2.5rem] pointer-events-none flex items-center justify-center"
                  style={{ opacity: dislikeOpacity }}
                >
                  <motion.span
                    className="text-danger text-5xl font-black rotate-[15deg] border-4 border-danger px-4 py-2 rounded-xl"
                    style={{
                      textShadow: "0 0 20px hsl(0 84% 60% / 0.6)",
                    }}
                  >
                    NOPE
                  </motion.span>
                </motion.div>

                {/* Image with parallax */}
                <div className="absolute inset-0 overflow-hidden">
                  {mainImage ? (
                    <motion.img
                      alt={currentItem.name}
                      className="w-full h-full object-cover scale-110"
                      src={mainImage}
                      draggable={false}
                      style={{ x: imageX }}
                    />
                  ) : (
                    <div className="w-full h-full bg-card flex items-center justify-center">
                      <Image className="h-16 w-16 text-foreground/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
                </div>

                {/* Card Content */}
                <div className="relative mt-auto w-full p-7 pb-28 space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-foreground/10 backdrop-blur-md border border-foreground/10 text-foreground/90 text-[10px] font-bold tracking-[0.1em] uppercase">
                        {currentItem.category}
                      </span>
                      {imageCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-foreground/5 text-foreground/80">
                          <Image className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-semibold">{imageCount}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <h2 className="text-foreground text-3xl font-bold tracking-tight">{currentItem.name}</h2>
                      <div className="flex items-center gap-1.5 text-foreground/60">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {currentItem.location || ownerProfile?.location || "Localização não informada"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-foreground/40 text-[11px] font-bold uppercase tracking-widest">
                      Valor de mercado
                    </span>
                    <span className="text-primary text-3xl font-extrabold tracking-tighter text-glow uppercase">
                      {formatValue(currentItem.market_value)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center items-center gap-6 px-4">
                  <motion.button
                    onClick={() => handleButtonSwipe("dislike")}
                    disabled={swiping}
                    className="flex items-center justify-center h-16 w-16 rounded-full bg-muted/80 border border-foreground/10 text-foreground/50 backdrop-blur-xl disabled:opacity-50"
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.08, borderColor: "hsl(0 84% 60% / 0.5)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <X className="h-8 w-8" />
                  </motion.button>
                  <motion.button
                    onClick={() => handleButtonSwipe("superlike")}
                    disabled={swiping}
                    className="flex items-center justify-center h-14 w-14 rounded-full bg-background border border-primary/40 text-primary neon-glow backdrop-blur-xl -translate-y-2 disabled:opacity-50"
                    whileTap={{ scale: 0.8, rotate: 15 }}
                    whileHover={{ scale: 1.15, boxShadow: "0 0 30px hsl(184 100% 50% / 0.5)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <Zap className="h-7 w-7" />
                  </motion.button>
                  <motion.button
                    onClick={() => handleButtonSwipe("like")}
                    disabled={swiping}
                    className="flex items-center justify-center h-16 w-16 rounded-full bg-primary border border-primary/20 text-background shadow-xl disabled:opacity-50"
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.08, boxShadow: "0 0 25px hsl(142 71% 45% / 0.4)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <Heart className="h-8 w-8" />
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      <BottomNav activeTab="explorar" />
    </ScreenLayout>
  );
};

export default Explorar;
