import {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useState,
  useEffect,
  useRef,
  memo,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  type PanInfo,
} from "framer-motion";
import {
  MapPin,
  Image,
  Package,
  ChevronUp,
  ChevronDown,
  Star,
  Repeat,
  Share2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRating } from "@/hooks/useRatings";
import { formatValue, translateCondition } from "@/lib/utils";
import { cdnFull, cdnBlur, cdnThumb } from "@/lib/imageUrl";
import { CardDetailContent } from "./SwipeCard/CardDetailContent";
import { SwipeActionButtons } from "./SwipeCard/SwipeActionButtons";
import { SwipeOverlays } from "./SwipeCard/SwipeOverlays";

const SWIPE_THRESHOLD = 80;
const EXIT_X = 500;

export interface SwipeCardHandle {
  triggerSwipe: (direction: "like" | "dislike") => void;
}

interface MatchedOwnItem {
  id: string;
  name: string;
  image_url: string | null;
  count?: number;
}

interface SwipeCardProps {
  item: any;
  onSwipeComplete: (direction: "like" | "dislike") => void;
  onDragDirectionChange?: (rawX: number) => void;
  disabled?: boolean;
  standby?: boolean;
  matchedOwnItem?: MatchedOwnItem | null;
}

const SwipeCard = memo(
  forwardRef<SwipeCardHandle, SwipeCardProps>(
    (
      { item, onSwipeComplete, onDragDirectionChange, disabled, standby, matchedOwnItem },
      ref
    ) => {
      const navigate = useNavigate();
      const x = useMotionValue(0);
      const rotate = useTransform(x, [-250, 0, 250], [-8, 0, 8]);

      // 3D lift effect — card pops out as it's dragged
      const absX = useTransform(x, (v) => Math.abs(v));
      const liftScale = useTransform(absX, [0, 250], [1, 1.06]);
      const liftShadow = useTransform(
        absX,
        [0, 250],
        [
          "0 4px 20px rgba(0,0,0,0.15)",
          "0 30px 60px -10px rgba(0,0,0,0.55), 0 18px 36px -8px rgba(0,0,0,0.4)",
        ]
      );

      // Image + video gallery state
      const images = item?.item_images || [];
      const videos = item?.item_videos || [];
      const hasVideo = videos.length > 0;
      const totalSlides = images.length + (hasVideo ? 1 : 0);
      const [activeImageIndex, setActiveImageIndex] = useState(0);
      const isVideoSlide = hasVideo && activeImageIndex === images.length;
      const currentImage = !isVideoSlide ? images[activeImageIndex]?.image_url : null;
      const currentVideo = isVideoSlide ? videos[0]?.video_url : null;
      const videoRef = useRef<HTMLVideoElement>(null);

      // Expanded state
      const [expanded, setExpanded] = useState(false);
      const scrollRef = useRef<HTMLDivElement>(null);

      const handleImageTap = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
          if (expanded) return;
          if (totalSlides <= 1) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const tapX = e.clientX - rect.left;
          const half = rect.width / 2;
          if (tapX > half) {
            setActiveImageIndex((i) => (i + 1) % totalSlides);
          } else {
            setActiveImageIndex((i) => (i - 1 + totalSlides) % totalSlides);
          }
        },
        [totalSlides, expanded]
      );

      const toggleExpand = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setExpanded((v) => !v);
      }, []);

      useEffect(() => {
        if (disabled || standby) return;
        const unsubscribe = x.on("change", (latest) => {
          onDragDirectionChange?.(latest);
        });
        return unsubscribe;
      }, [x, disabled, standby, onDragDirectionChange]);

      const doExit = useCallback(
        (direction: "like" | "dislike", velocityX?: number) => {
          if (disabled || standby || expanded) return;
          const exitX = direction === "like" ? EXIT_X : -EXIT_X;
          const vel = velocityX != null ? velocityX : direction === "like" ? 800 : -800;
          animate(x, exitX, {
            type: "spring",
            stiffness: 600,
            damping: 35,
            velocity: vel,
            restSpeed: 100,
            onComplete: () => onSwipeComplete(direction),
          });
        },
        [disabled, standby, expanded, x, onSwipeComplete]
      );

      useImperativeHandle(ref, () => ({
        triggerSwipe: (dir) => doExit(dir),
      }));

      const handleDragEnd = useCallback(
        (_: any, info: PanInfo) => {
          if (expanded) return;
          const velocity = info.velocity.x;
          const offset = info.offset.x;

          if (offset > SWIPE_THRESHOLD || velocity > 400) {
            doExit("like", velocity);
          } else if (offset < -SWIPE_THRESHOLD || velocity < -400) {
            doExit("dislike", velocity);
          } else {
            animate(x, 0, { type: "spring", stiffness: 700, damping: 28, mass: 0.8 });
          }
        },
        [doExit, x, expanded]
      );

      const ownerProfile = item?.profiles as any;
      const conditionLabel = translateCondition(item?.condition);
      const { data: rating } = useUserRating(ownerProfile?.user_id);

      return (
        <motion.div
          className={`absolute inset-0 w-full h-full ${
            standby ? "pointer-events-none" : expanded ? "" : "touch-none"
          }`}
          style={{
            x: standby ? 0 : x,
            rotate: standby || expanded ? 0 : rotate,
            scale: standby ? 0.97 : expanded ? 1 : liftScale,
            boxShadow: standby || expanded ? undefined : liftShadow,
            zIndex: standby ? 9 : 60,
            willChange: standby ? "auto" : "transform",
            transformOrigin: "50% 80%",
            borderRadius: "1.5rem",
            ...(standby ? { y: 0, opacity: 0 } : {}),
          }}
          drag={standby || expanded ? false : true}
          dragDirectionLock
          dragConstraints={{ top: 0, bottom: 0, left: -500, right: 500 }}
          dragElastic={{ top: 0, bottom: 0, left: 0.65, right: 0.65 }}
          onDragEnd={standby || expanded ? undefined : handleDragEnd}
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
                src={cdnBlur(currentImage)}
                alt=""
                className="w-full h-full object-cover scale-105 blur-xl opacity-90 saturate-150"
                draggable={false}
              />
              <div className="absolute inset-0 bg-background/30 dark:bg-scrim/40" />
            </div>
          )}
          {!currentImage && (
            <div
              className="absolute -inset-[3px] rounded-[1.65rem] overflow-hidden z-0 bg-border dark:bg-primary/30"
              aria-hidden
            />
          )}

          {/* Inner card */}
          <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden z-[1] shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-none">
            {!standby && !expanded && <SwipeOverlays x={x} />}

            {/* ===== FULL IMAGE / VIDEO ===== */}
            <div
              className="absolute inset-0 w-full h-full"
              onClick={standby ? undefined : handleImageTap}
            >
              {isVideoSlide && currentVideo ? (
                <video
                  ref={videoRef}
                  key={`video-${activeImageIndex}`}
                  className="w-full h-full object-cover object-center"
                  src={currentVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  draggable={false}
                />
              ) : currentImage ? (
                <img
                  key={activeImageIndex}
                  alt={item.name}
                  className="w-full h-full object-cover object-center"
                  src={cdnFull(currentImage)}
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Image className="h-16 w-16 text-foreground/10" />
                </div>
              )}
            </div>

            {/* Owner mini-profile */}
            {ownerProfile && !expanded && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/usuario/${ownerProfile.user_id}`);
                }}
                className="absolute top-4 left-4 z-30 flex items-center gap-1.5 max-w-[45%] pl-1 pr-2.5 py-1 rounded-full bg-scrim/35 backdrop-blur-xl border border-on-media/10 hover:border-on-media/30 active:scale-95 transition-all cursor-pointer"
              >
                {ownerProfile.avatar_url ? (
                  <img
                    src={ownerProfile.avatar_url}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover border border-on-media/30 shrink-0"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-on-media/20 flex items-center justify-center text-on-media text-[9px] font-bold shrink-0">
                    {(ownerProfile.display_name || "?")[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-on-media text-[11px] font-semibold drop-shadow-md truncate min-w-0">
                  {(() => {
                    const full = ownerProfile.display_name || "Usuário";
                    const first = full.split(" ")[0];
                    return full.includes(" ") ? `${first}...` : first;
                  })()}
                </span>
                {rating && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-400 text-[10px] font-bold">
                      {Number(rating.average).toFixed(1)}
                    </span>
                  </div>
                )}
              </button>
            )}

            {/* Slide dots */}
            {!expanded && totalSlides > 1 && (
              <div className="absolute top-0.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-scrim/30 backdrop-blur-xl border border-on-media/10">
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-200 ${
                      i === activeImageIndex ? "w-3.5 bg-on-media" : "w-1 bg-on-media/40"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Share */}
            {!expanded && (
              <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const shareUrl = `${window.location.origin}/item/${item.id}`;
                    const shareData = {
                      title: `${item.name} — Hypou`,
                      text: `Olha esse item no Hypou: ${item.name} por ${formatValue(item.market_value)}! Quer trocar?`,
                      url: shareUrl,
                    };
                    if (navigator.share) {
                      navigator.share(shareData).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(`${shareData.text} ${shareUrl}`);
                    }
                  }}
                  className="h-8 w-8 rounded-full bg-scrim/30 backdrop-blur-xl border border-on-media/10 flex items-center justify-center"
                >
                  <Share2 className="h-3.5 w-3.5 text-on-media" />
                </button>
              </div>
            )}

            {/* Top gradient */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-scrim/40 via-scrim/15 to-transparent pointer-events-none z-20" />

            {/* Tap zones */}
            {!expanded && !standby && totalSlides > 1 && (
              <>
                <div
                  className="absolute top-0 bottom-0 left-0 w-1/2 z-[25]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((i) => (i - 1 + totalSlides) % totalSlides);
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 right-0 w-1/2 z-[25]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((i) => (i + 1) % totalSlides);
                  }}
                />
              </>
            )}

            {expanded && (
              <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20 h-full bg-gradient-to-t from-scrim/80 via-scrim/60 to-scrim/40" />
            )}

            {/* ===== EXPANDED OVERLAY ===== */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute inset-x-3 bottom-3 top-3 z-30 flex flex-col rounded-2xl bg-on-media/15 dark:bg-on-media/10 backdrop-blur-2xl border border-on-media/20 dark:border-on-media/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
                >
                  <button
                    onClick={toggleExpand}
                    className="w-full flex justify-center items-center gap-1 pt-4 pb-2 text-on-media/60 shrink-0"
                  >
                    <ChevronDown className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Recolher
                    </span>
                  </button>

                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto no-scrollbar overscroll-contain"
                    onTouchMove={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 pb-2">
                      <h2 className="text-on-media text-xl font-bold tracking-tight drop-shadow-md">
                        {item.name}
                      </h2>
                      {matchedOwnItem && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Repeat className="h-3 w-3 text-primary shrink-0" />
                          {matchedOwnItem.image_url ? (
                            <img
                              src={matchedOwnItem.image_url}
                              alt={matchedOwnItem.name}
                              className="h-5 w-5 rounded-full object-cover border border-primary/50"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                              <Package className="h-2.5 w-2.5 text-primary" />
                            </div>
                          )}
                          <span className="text-on-media/70 text-xs font-medium">
                            Compatível com{" "}
                            <span className="text-primary font-semibold">
                              {matchedOwnItem.name}
                            </span>
                            {(matchedOwnItem.count ?? 0) > 1 && (
                              <span className="text-on-media/40">
                                {" "}
                                e +{(matchedOwnItem.count ?? 0) - 1}{" "}
                                {(matchedOwnItem.count ?? 0) - 1 === 1
                                  ? "item seu"
                                  : "itens seus"}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <CardDetailContent item={item} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ===== COMPACT INFO ===== */}
            {activeImageIndex === 0 && !expanded && (
              <div
                className="absolute bottom-0 inset-x-0 z-30 rounded-b-[1.5rem] overflow-hidden pointer-events-none"
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 18%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.88) 75%, rgba(0,0,0,0.98) 100%)",
                }}
              >
                <div className="relative px-5 mt-80 pb-10 pointer-events-none">
                  {matchedOwnItem && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Repeat className="h-3 w-3 text-primary shrink-0" />
                      {matchedOwnItem.image_url ? (
                        <img
                          src={matchedOwnItem.image_url}
                          alt={matchedOwnItem.name}
                          className="h-4 w-4 rounded-full object-cover border border-primary/50"
                        />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                          <Package className="h-2 w-2 text-primary" />
                        </div>
                      )}
                      <span className="text-on-media/70 text-[10px] font-medium truncate">
                        Compatível com{" "}
                        <span className="text-primary font-semibold">
                          {matchedOwnItem.name}
                        </span>
                        {(matchedOwnItem.count ?? 0) > 1 && (
                          <span className="text-on-media/50">
                            {" "}
                            +{(matchedOwnItem.count ?? 0) - 1}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                    <span className="px-2 py-0.5 rounded-full bg-on-media/10 border border-on-media/10 text-on-media text-[10px] font-semibold tracking-wide uppercase shrink-0">
                      {item.category}
                    </span>
                    {conditionLabel && (
                      <span className="px-2 py-0.5 rounded-full bg-on-media/10 border border-on-media/10 text-on-media/80 text-[10px] font-semibold uppercase flex items-center gap-1 shrink-0">
                        <Package className="h-2.5 w-2.5" /> {conditionLabel}
                      </span>
                    )}
                    {item.location && (
                      <span className="px-2 py-0.5 rounded-full bg-on-media/10 border border-on-media/10 text-on-media/80 text-[10px] font-semibold uppercase flex items-center gap-1 truncate min-w-0">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />{" "}
                        <span className="truncate">{item.location}</span>
                      </span>
                    )}
                  </div>

                  <h2 className="text-on-media text-[22px] font-bold tracking-tight leading-tight truncate">
                    {item.name}
                  </h2>

                  <p className="text-on-media/70 text-[15px] font-medium tracking-tight mt-0.5">
                    {formatValue(item.market_value)}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(e);
                    }}
                    aria-label="Ver detalhes do item"
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-on-media/10 border border-on-media/15 backdrop-blur-md text-on-media/80 text-[10px] font-semibold uppercase tracking-widest active:scale-95 transition-transform pointer-events-auto"
                  >
                    <ChevronUp className="h-3 w-3" />
                    Ver detalhes
                  </button>

                  <SwipeActionButtons
                    x={x}
                    disabled={disabled}
                    standby={standby}
                    onDislike={() => doExit("dislike")}
                    onLike={() => doExit("like")}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      );
    }
  )
);

SwipeCard.displayName = "SwipeCard";

export default SwipeCard;
