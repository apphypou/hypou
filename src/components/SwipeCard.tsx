import {
  forwardRef,
  useImperativeHandle,
  useCallback,
  type Ref,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  animate,
  type PanInfo,
} from "framer-motion";
import { X, Zap, Heart, MapPin, Image } from "lucide-react";

const SWIPE_THRESHOLD = 80;

export interface SwipeCardHandle {
  triggerSwipe: (direction: "like" | "dislike" | "superlike") => void;
}

interface SwipeCardProps {
  item: any;
  onSwipeComplete: (direction: "like" | "dislike" | "superlike") => void;
  onDragProgressChange?: (progress: number) => void;
  disabled?: boolean;
}

const formatValue = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  ({ item, onSwipeComplete, onDragProgressChange, disabled }, ref) => {
    // Each card gets its own motion value — fixes Bug 3
    const x = useMotionValue(0);
    const rawRotate = useTransform(x, [-300, 300], [-18, 18]);
    const rotate = useSpring(rawRotate, { stiffness: 300, damping: 30 });

    const likeOpacity = useTransform(x, [0, 80], [0, 1]);
    const dislikeOpacity = useTransform(x, [-80, 0], [1, 0]);
    const likeGlowOpacity = useTransform(x, [0, 60, 120], [0, 0.3, 0.8]);
    const dislikeGlowOpacity = useTransform(x, [-120, -60, 0], [0.8, 0.3, 0]);
    const rotateY = useTransform(x, [-200, 200], [-8, 8]);
    const imageX = useTransform(x, [-200, 200], [30, -30]);

    // Report drag progress to parent for stack animation
    useTransform(x, (latest) => {
      const progress = Math.min(Math.abs(latest) / 200, 1);
      onDragProgressChange?.(progress);
      return progress;
    });

    const exitDirection = useMotionValue<"like" | "dislike" | "superlike" | null>(null);

    const doExit = useCallback(
      (direction: "like" | "dislike" | "superlike") => {
        if (disabled) return;
        exitDirection.set(direction);

        if (direction === "superlike") {
          // For superlike we just call complete immediately (parent handles flash/particles)
          onSwipeComplete("superlike");
        } else {
          const exitX = direction === "like" ? 600 : -600;
          animate(x, exitX, {
            type: "spring",
            stiffness: 600,
            damping: 40,
            velocity: exitX > 0 ? 800 : -800,
            onComplete: () => {
              onSwipeComplete(direction);
            },
          });
        }
      },
      [disabled, x, onSwipeComplete, exitDirection]
    );

    useImperativeHandle(ref, () => ({
      triggerSwipe: doExit,
    }));

    const handleDragEnd = useCallback(
      (_: any, info: PanInfo) => {
        const velocity = info.velocity.x;
        const offset = info.offset.x;

        if (offset > SWIPE_THRESHOLD || velocity > 500) {
          doExit("like");
        } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
          doExit("dislike");
        } else {
          animate(x, 0, {
            type: "spring",
            stiffness: 800,
            damping: 25,
            mass: 0.5,
          });
        }
      },
      [doExit, x]
    );

    const mainImage = item?.item_images?.[0]?.image_url;
    const imageCount = item?.item_images?.length || 0;
    const ownerProfile = item?.profiles as any;

    return (
      <motion.div
        className="relative z-10 flex-1 w-full bg-muted rounded-[2.5rem] overflow-hidden flex flex-col swipe-card touch-none"
        style={{
          x,
          rotate,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        drag="x"
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
            style={{ textShadow: "0 0 20px hsl(142 71% 45% / 0.6)" }}
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
            style={{ textShadow: "0 0 20px hsl(0 84% 60% / 0.6)" }}
          >
            NOPE
          </motion.span>
        </motion.div>

        {/* Image with parallax */}
        <div className="absolute inset-0 overflow-hidden">
          {mainImage ? (
            <motion.img
              alt={item.name}
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
        <div className="relative z-20 mt-auto w-full p-7 pb-28 space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-foreground/10 backdrop-blur-md border border-foreground/10 text-foreground/90 text-[10px] font-bold tracking-[0.1em] uppercase">
                {item.category}
              </span>
              {imageCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-foreground/5 text-foreground/80">
                  <Image className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-semibold">{imageCount}</span>
                </div>
              )}
            </div>
            <div className="space-y-0.5">
              <h2 className="text-foreground text-3xl font-bold tracking-tight">{item.name}</h2>
              <div className="flex items-center gap-1.5 text-foreground/60">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {item.location || ownerProfile?.location || "Localização não informada"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground/40 text-[11px] font-bold uppercase tracking-widest">
              Valor de mercado
            </span>
            <span className="text-primary text-3xl font-extrabold tracking-tighter text-glow uppercase">
              {formatValue(item.market_value)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center items-center gap-6 px-4">
          <motion.button
            onClick={() => doExit("dislike")}
            disabled={disabled}
            className="flex items-center justify-center h-16 w-16 rounded-full bg-muted/80 border border-foreground/10 text-foreground/50 backdrop-blur-xl disabled:opacity-50"
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.08, borderColor: "hsl(0 84% 60% / 0.5)" }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <X className="h-8 w-8" />
          </motion.button>
          <motion.button
            onClick={() => doExit("superlike")}
            disabled={disabled}
            className="flex items-center justify-center h-14 w-14 rounded-full bg-background border border-primary/40 text-primary neon-glow backdrop-blur-xl -translate-y-2 disabled:opacity-50"
            whileTap={{ scale: 0.8, rotate: 15 }}
            whileHover={{ scale: 1.15, boxShadow: "0 0 30px hsl(184 100% 50% / 0.5)" }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <Zap className="h-7 w-7" />
          </motion.button>
          <motion.button
            onClick={() => doExit("like")}
            disabled={disabled}
            className="flex items-center justify-center h-16 w-16 rounded-full bg-primary border border-primary/20 text-background shadow-xl disabled:opacity-50"
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.08, boxShadow: "0 0 25px hsl(142 71% 45% / 0.4)" }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <Heart className="h-8 w-8" />
          </motion.button>
        </div>
      </motion.div>
    );
  }
);

SwipeCard.displayName = "SwipeCard";

export default SwipeCard;
