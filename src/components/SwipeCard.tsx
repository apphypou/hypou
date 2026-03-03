import {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useState,
  useEffect,
  memo,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import { MapPin, Image, Package } from "lucide-react";

const SWIPE_THRESHOLD = 80;
const EXIT_X = 500;

export interface SwipeCardHandle {
  triggerSwipe: (direction: "like" | "dislike") => void;
}

interface SwipeCardProps {
  item: any;
  onSwipeComplete: (direction: "like" | "dislike") => void;
  onDragDirectionChange?: (rawX: number) => void;
  disabled?: boolean;
  standby?: boolean;
}

const formatValue = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const CONDITION_MAP: Record<string, string> = {
  used: "Usado",
  USED: "Usado",
  new: "Novo",
  NEW: "Novo",
  like_new: "Semi-novo",
  LIKE_NEW: "Semi-novo",
  "semi-novo": "Semi-novo",
  "Semi-novo": "Semi-novo",
};

const translateCondition = (raw: string | null | undefined) => {
  if (!raw) return null;
  return CONDITION_MAP[raw] || raw;
};

const SwipeCard = memo(forwardRef<SwipeCardHandle, SwipeCardProps>(
  ({ item, onSwipeComplete, onDragDirectionChange, disabled, standby }, ref) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-250, 0, 250], [-8, 0, 8]);

    // Stamp opacity & scale
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const dislikeOpacity = useTransform(x, [-100, 0], [1, 0]);
    const likeStampScale = useTransform(x, [0, 100], [0.5, 1.0]);
    const dislikeStampScale = useTransform(x, [-100, 0], [1.0, 0.5]);

    // Edge glow
    const likeGlowOpacity = useTransform(x, [0, 60, 140], [0, 0.25, 0.7]);
    const dislikeGlowOpacity = useTransform(x, [-140, -60, 0], [0.7, 0.25, 0]);

    // Image gallery state
    const images = item?.item_images || [];
    const imageCount = images.length;
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const currentImage = images[activeImageIndex]?.image_url;

    const handleImageTap = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (imageCount <= 1) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const tapX = e.clientX - rect.left;
        const half = rect.width / 2;
        if (tapX > half) {
          setActiveImageIndex((i) => (i + 1) % imageCount);
        } else {
          setActiveImageIndex((i) => (i - 1 + imageCount) % imageCount);
        }
      },
      [imageCount]
    );

    useEffect(() => {
      if (disabled || standby) return;
      const unsubscribe = x.on("change", (latest) => {
        onDragDirectionChange?.(latest);
      });
      return unsubscribe;
    }, [x, disabled, standby, onDragDirectionChange]);

    const doExit = useCallback(
      (direction: "like" | "dislike", velocityX?: number) => {
        if (disabled || standby) return;
        const exitX = direction === "like" ? EXIT_X : -EXIT_X;
        const vel = velocityX != null ? velocityX : (direction === "like" ? 800 : -800);
        animate(x, exitX, {
          type: "spring",
          stiffness: 600,
          damping: 35,
          velocity: vel,
          restSpeed: 100,
          onComplete: () => onSwipeComplete(direction),
        });
      },
      [disabled, standby, x, onSwipeComplete]
    );

    useImperativeHandle(ref, () => ({
      triggerSwipe: (dir) => doExit(dir),
    }));

    const handleDragEnd = useCallback(
      (_: any, info: PanInfo) => {
        const velocity = info.velocity.x;
        const offset = info.offset.x;
        if (offset > SWIPE_THRESHOLD || velocity > 400) {
          doExit("like", velocity);
        } else if (offset < -SWIPE_THRESHOLD || velocity < -400) {
          doExit("dislike", velocity);
        } else {
          animate(x, 0, { type: "spring", stiffness: 600, damping: 26, mass: 0.8 });
        }
      },
      [doExit, x]
    );

    const ownerProfile = item?.profiles as any;
    const conditionLabel = translateCondition(item?.condition);

    return (
      <motion.div
        className={`absolute inset-0 w-full h-full ${
          standby ? "pointer-events-none" : "touch-none"
        }`}
        style={{
          x: standby ? 0 : x,
          rotate: standby ? 0 : rotate,
          zIndex: standby ? 9 : 10,
          willChange: standby ? "auto" : "transform",
          transformOrigin: "50% 80%",
          ...(standby ? { scale: 0.97, y: 0, opacity: 0 } : {}),
        }}
        drag={standby ? false : "x"}
        dragElastic={0.65}
        onDragEnd={standby ? undefined : handleDragEnd}
        initial={standby ? false : { scale: 1, opacity: 1 }}
        animate={standby ? { scale: 1, opacity: 1 } : undefined}
      >
        {/* Liquid glass border — blurred image reflection */}
        {currentImage && (
          <div
            className="absolute -inset-[3px] rounded-[1.65rem] overflow-hidden z-0"
            aria-hidden
          >
            <img
              src={currentImage}
              alt=""
              className="w-full h-full object-cover scale-105 blur-xl opacity-70 dark:opacity-90 saturate-150"
              draggable={false}
            />
            <div className="absolute inset-0 bg-background/30 dark:bg-black/40" />
          </div>
        )}
        {!currentImage && (
          <div className="absolute -inset-[3px] rounded-[1.65rem] overflow-hidden z-0 bg-border dark:bg-primary/30" aria-hidden />
        )}

        {/* Inner card */}
        <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden z-[1] shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-none">
        {/* Glow borders */}
        {!standby && (
          <>
            <motion.div
              className="absolute inset-0 z-40 rounded-[1.5rem] pointer-events-none"
              style={{
                opacity: likeGlowOpacity,
                boxShadow: "inset 0 0 40px hsl(142 71% 45% / 0.4), 0 0 30px hsl(142 71% 45% / 0.3)",
                border: "2px solid hsl(142 71% 45% / 0.6)",
              }}
            />
            <motion.div
              className="absolute inset-0 z-40 rounded-[1.5rem] pointer-events-none"
              style={{
                opacity: dislikeGlowOpacity,
                boxShadow: "inset 0 0 40px hsl(0 84% 60% / 0.4), 0 0 30px hsl(0 84% 60% / 0.3)",
                border: "2px solid hsl(0 84% 60% / 0.6)",
              }}
            />

            {/* Like/Dislike stamps */}
            <motion.div
              className="absolute inset-0 z-50 rounded-[1.5rem] pointer-events-none flex items-center justify-center"
              style={{ opacity: likeOpacity }}
            >
              <motion.span
                className="text-success text-5xl font-black rotate-[-15deg] border-4 border-success px-4 py-2 rounded-xl"
                style={{ textShadow: "0 0 20px hsl(142 71% 45% / 0.6)", scale: likeStampScale }}
              >
                HYPOU
              </motion.span>
            </motion.div>
            <motion.div
              className="absolute inset-0 z-50 rounded-[1.5rem] pointer-events-none flex items-center justify-center"
              style={{ opacity: dislikeOpacity }}
            >
              <motion.span
                className="text-danger text-5xl font-black rotate-[15deg] border-4 border-danger px-4 py-2 rounded-xl"
                style={{ textShadow: "0 0 20px hsl(0 84% 60% / 0.6)", scale: dislikeStampScale }}
              >
                PASSAR
              </motion.span>
            </motion.div>
          </>
        )}

        {/* ===== FULL IMAGE ===== */}
        <div className="absolute inset-0 w-full h-full" onClick={standby ? undefined : handleImageTap}>
          {currentImage ? (
            <img
              key={activeImageIndex}
              alt={item.name}
              className="w-full h-full object-cover object-center"
              src={currentImage}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Image className="h-16 w-16 text-foreground/10" />
            </div>
          )}
        </div>

        {/* Owner mini-profile — top left */}
        {ownerProfile && (
          <div className="absolute top-5 left-5 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/10">
            {ownerProfile.avatar_url ? (
              <img
                src={ownerProfile.avatar_url}
                alt=""
                className="h-6 w-6 rounded-full object-cover border border-white/30"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold">
                {(ownerProfile.display_name || "?")[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-white text-xs font-semibold drop-shadow-md">
              {ownerProfile.display_name || "Usuário"}
            </span>
          </div>
        )}

        {/* Image dots — top right */}
        {imageCount > 1 && (
          <div className="absolute top-5 right-5 z-30 flex items-center gap-1.5">
            {images.map((_: any, i: number) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === activeImageIndex ? "w-5 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Top gradient for readability */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent pointer-events-none z-20" />

        {/* Bottom gradient for glass panel readability */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none z-20" />

        {/* ===== LIQUID GLASS INFO PANEL ===== */}
        <div className="absolute bottom-0 inset-x-0 z-30 p-4">
          <div className="rounded-[1.5rem] bg-white/15 dark:bg-white/10 backdrop-blur-2xl border border-white/20 dark:border-white/10 p-4 space-y-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 border border-white/20 text-white text-[10px] font-bold tracking-[0.1em] uppercase">
                {item.category}
              </span>
              {conditionLabel && (
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-white/70" />
                  <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/15 text-white/90 text-[10px] font-bold uppercase tracking-wider">
                    {conditionLabel}
                  </span>
                </div>
              )}
            </div>

            <h2 className="text-white text-xl font-bold tracking-tight leading-tight drop-shadow-md">
              {item.name}
            </h2>

            <span className="block text-white text-2xl font-extrabold tracking-tighter drop-shadow-md">
              {formatValue(item.market_value)}
            </span>

            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-white/70" />
              <span className="text-white/80 text-xs font-medium">
                {item.location || ownerProfile?.location || "Local não informado"}
              </span>
            </div>

            {item.description && (
              <p className="text-white/70 text-xs leading-snug line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </div>
        </div>{/* close inner card */}
      </motion.div>
    );
  }
));

SwipeCard.displayName = "SwipeCard";

export default SwipeCard;
