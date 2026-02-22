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
import { MapPin, Image } from "lucide-react";

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
    const x = useMotionValue(0);
    const rawRotate = useTransform(x, [-300, 300], [-18, 18]);
    const rotate = useSpring(rawRotate, { stiffness: 300, damping: 30 });

    const likeOpacity = useTransform(x, [0, 80], [0, 1]);
    const dislikeOpacity = useTransform(x, [-80, 0], [1, 0]);
    const likeGlowOpacity = useTransform(x, [0, 60, 120], [0, 0.3, 0.8]);
    const dislikeGlowOpacity = useTransform(x, [-120, -60, 0], [0.8, 0.3, 0]);
    const rotateY = useTransform(x, [-200, 200], [-8, 8]);
    const imageX = useTransform(x, [-200, 200], [30, -30]);

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

        {/* Like/Dislike stamp overlays — z-50 above everything */}
        <motion.div
          className="absolute inset-0 z-50 rounded-[2.5rem] pointer-events-none flex items-center justify-center"
          style={{ opacity: likeOpacity }}
        >
          <motion.span
            className="text-success text-5xl font-black rotate-[-15deg] border-4 border-success px-4 py-2 rounded-xl"
            style={{ textShadow: "0 0 20px hsl(142 71% 45% / 0.6)" }}
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
            style={{ textShadow: "0 0 20px hsl(0 84% 60% / 0.6)" }}
          >
            PASSAR
          </motion.span>
        </motion.div>

        {/* Image — no scale-110, object-center explicit */}
        <div className="absolute inset-0 overflow-hidden">
          {mainImage ? (
            <motion.img
              alt={item.name}
              className="w-full h-full object-cover object-center"
              src={mainImage}
              draggable={false}
              style={{ x: imageX }}
            />
          ) : (
            <div className="w-full h-full bg-card flex items-center justify-center">
              <Image className="h-16 w-16 text-foreground/10" />
            </div>
          )}
          {/* Stronger gradient: two layers + higher via opacity */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        </div>

        {/* Card Content — text-shadow for contrast */}
        <div className="relative z-20 mt-auto w-full p-7 pb-8 space-y-4">
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
              <h2
                className="text-foreground text-3xl font-bold tracking-tight"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}
              >
                {item.name}
              </h2>
              <div className="flex items-center gap-1.5 text-foreground/60">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                  {item.location || ownerProfile?.location || "Localização não informada"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground/40 text-[11px] font-bold uppercase tracking-widest">
              Valor de mercado
            </span>
            <span
              className="text-primary text-3xl font-extrabold tracking-tighter text-glow uppercase"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
            >
              {formatValue(item.market_value)}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }
);

SwipeCard.displayName = "SwipeCard";

export default SwipeCard;
