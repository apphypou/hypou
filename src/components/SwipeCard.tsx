import {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useState,
  useEffect,
  memo,
  type Ref,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import { MapPin, Image, Package } from "lucide-react";

const SWIPE_THRESHOLD = 100;

export interface SwipeCardHandle {
  triggerSwipe: (direction: "like" | "dislike") => void;
}

interface SwipeCardProps {
  item: any;
  onSwipeComplete: (direction: "like" | "dislike") => void;
  onDragProgressChange?: (progress: number) => void;
  onDragDirectionChange?: (rawX: number) => void;
  disabled?: boolean;
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
  ({ item, onSwipeComplete, onDragProgressChange, onDragDirectionChange, disabled }, ref) => {
    const x = useMotionValue(0);

    // Direct rotation from drag — no spring, immediate response
    const rotate = useTransform(x, [-200, 200], [-15, 15]);

    const likeOpacity = useTransform(x, [0, 80], [0, 1]);
    const dislikeOpacity = useTransform(x, [-80, 0], [1, 0]);
    // Stamp scale — grows from 0.5 to 1.0 (stamp/carimbo effect)
    const likeStampScale = useTransform(x, [0, 80], [0.5, 1.0]);
    const dislikeStampScale = useTransform(x, [-80, 0], [1.0, 0.5]);

    const likeGlowOpacity = useTransform(x, [0, 60, 120], [0, 0.3, 0.8]);
    const dislikeGlowOpacity = useTransform(x, [-120, -60, 0], [0.8, 0.3, 0]);

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

    // Report drag progress and direction via onChange (not useTransform side-effect)
    useEffect(() => {
      if (disabled) return;
      const unsubscribe = x.on("change", (latest) => {
        const progress = Math.min(Math.abs(latest) / 200, 1);
        onDragProgressChange?.(progress);
        onDragDirectionChange?.(latest);
      });
      return unsubscribe;
    }, [x, disabled, onDragProgressChange, onDragDirectionChange]);

    const doExit = useCallback(
      (direction: "like" | "dislike", velocityX?: number) => {
        if (disabled) return;
        const exitX = direction === "like" ? 600 : -600;
        const vel = velocityX != null ? velocityX : (direction === "like" ? 800 : -800);
        animate(x, exitX, {
          type: "spring",
          stiffness: 400,
          damping: 30,
          velocity: vel,
          onComplete: () => {
            onSwipeComplete(direction);
          },
        });
      },
      [disabled, x, onSwipeComplete]
    );

    useImperativeHandle(ref, () => ({
      triggerSwipe: (dir) => doExit(dir),
    }));

    const handleDragEnd = useCallback(
      (_: any, info: PanInfo) => {
        const velocity = info.velocity.x;
        const offset = info.offset.x;

        if (offset > SWIPE_THRESHOLD || velocity > 500) {
          doExit("like", velocity);
        } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
          doExit("dislike", velocity);
        } else {
          // Bouncy snap-back with subtle overshoot
          animate(x, 0, {
            type: "spring",
            stiffness: 500,
            damping: 22,
          });
        }
      },
      [doExit, x]
    );

    const ownerProfile = item?.profiles as any;
    const conditionLabel = translateCondition(item?.condition);

    return (
      <motion.div
        className="relative z-10 flex-1 w-full bg-card rounded-[2.5rem] overflow-hidden flex flex-col swipe-card touch-none shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-none dark:bg-muted"
        style={{
          x,
          rotate,
          transformOrigin: "50% 100%",
          willChange: "transform",
        }}
        drag="x"
        dragElastic={0.75}
        onDragEnd={handleDragEnd}
        initial={false}
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

        {/* Like/Dislike stamp overlays — with scale animation */}
        <motion.div
          className="absolute inset-0 z-50 rounded-[2.5rem] pointer-events-none flex items-center justify-center"
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
          className="absolute inset-0 z-50 rounded-[2.5rem] pointer-events-none flex items-center justify-center"
          style={{ opacity: dislikeOpacity }}
        >
          <motion.span
            className="text-danger text-5xl font-black rotate-[15deg] border-4 border-danger px-4 py-2 rounded-xl"
            style={{ textShadow: "0 0 20px hsl(0 84% 60% / 0.6)", scale: dislikeStampScale }}
          >
            PASSAR
          </motion.span>
        </motion.div>

        {/* ===== IMAGE SECTION — top ~60% ===== */}
        <div className="relative w-full flex-[3] min-h-0 overflow-hidden" onClick={handleImageTap}>
          {/* Owner mini-profile — top-left over image */}
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

          {/* Image dots indicator — top-right */}
          {imageCount > 1 && (
            <div className="absolute top-5 right-5 z-30 flex items-center gap-1.5">
              {images.map((_: any, i: number) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === activeImageIndex
                      ? "w-5 bg-white"
                      : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Subtle top gradient for owner profile readability */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent pointer-events-none z-20" />

          {/* The image itself */}
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

        {/* ===== CONTENT SECTION — bottom ~40%, solid background ===== */}
        <div className="relative z-20 w-full flex-[2] bg-card dark:bg-muted p-5 pb-24 space-y-2">
          {/* Category badge */}
          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-[0.1em] uppercase">
            {item.category}
          </span>

          {/* Name */}
          <h2 className="text-foreground text-xl font-bold tracking-tight leading-tight">
            {item.name}
          </h2>

          {/* Market value */}
          <span className="block text-primary text-2xl font-extrabold tracking-tighter">
            {formatValue(item.market_value)}
          </span>

          {/* Location + Condition */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">
                {item.location || ownerProfile?.location || "Local não informado"}
              </span>
            </div>
            {conditionLabel && (
              <div className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-primary/70" />
                <span className="px-2 py-0.5 rounded-full bg-muted dark:bg-foreground/10 border border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  {conditionLabel}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-muted-foreground text-xs leading-snug line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </motion.div>
    );
  }
));

SwipeCard.displayName = "SwipeCard";

export default SwipeCard;
