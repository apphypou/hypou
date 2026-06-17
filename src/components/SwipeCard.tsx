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
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import {
  MapPin,
  Image,
  Package,
  ChevronDown,
  Star,
  Repeat,
  Share2,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRating } from "@/hooks/useRatings";
import { formatValue, translateCondition } from "@/lib/utils";
import { cdnFull, cdnBlur, cdnThumb } from "@/lib/imageUrl";
import { preloadImage, preloadImages, preloadVideo, preloadVideos } from "@/lib/mediaPreload";
import { CardDetailContent } from "./SwipeCard/CardDetailContent";
import { SwipeActionButtons } from "./SwipeCard/SwipeActionButtons";
import { SwipeOverlays } from "./SwipeCard/SwipeOverlays";

const SWIPE_THRESHOLD = 80;
const EXIT_X = 500;
const EXIT_Y = 260;

const STATE_ABBREVIATIONS: Record<string, string> = {
  acre: "AC",
  alagoas: "AL",
  amapá: "AP",
  amazonas: "AM",
  bahia: "BA",
  ceará: "CE",
  "distrito federal": "DF",
  "espírito santo": "ES",
  goiás: "GO",
  maranhão: "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  pará: "PA",
  paraíba: "PB",
  paraná: "PR",
  pernambuco: "PE",
  piauí: "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  rondônia: "RO",
  roraima: "RR",
  "santa catarina": "SC",
  "são paulo": "SP",
  sergipe: "SE",
  tocantins: "TO",
};

const formatCompactLocation = (location?: string | null) => {
  if (!location) return "";
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return location;
  const city = parts[0];
  const state = parts[parts.length - 1];
  const normalizedState = state.toLocaleLowerCase("pt-BR");
  return `${city}, ${STATE_ABBREVIATIONS[normalizedState] || state}`;
};

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
  revealMotionX?: MotionValue<number>;
  matchedOwnItem?: MatchedOwnItem | null;
  onOpenFilters?: () => void;
  hasActiveFilters?: boolean;
}

const SwipeCard = memo(
  forwardRef<SwipeCardHandle, SwipeCardProps>(
    (
      { item, onSwipeComplete, onDragDirectionChange, disabled, standby, revealMotionX, matchedOwnItem, onOpenFilters, hasActiveFilters },
      ref
    ) => {
      const navigate = useNavigate();
      const x = useMotionValue(0);
      const y = useMotionValue(0);
      const rotate = useTransform(x, [-250, 0, 250], [-8, 0, 8]);
      const revealSource = revealMotionX ?? x;
      const revealProgress = useTransform(revealSource, (value) =>
        Math.min(Math.abs(value) / SWIPE_THRESHOLD, 1)
      );
      const standbyOpacity = useTransform(revealProgress, [0, 1], [0, 1]);
      const standbyScale = useTransform(revealProgress, [0, 1], [0.97, 1]);

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
      const slideChangeTokenRef = useRef(0);

      // Expanded state
      const [expanded, setExpanded] = useState(false);
      const scrollRef = useRef<HTMLDivElement>(null);

      const showSlide = useCallback(
        (nextIndex: number) => {
          if (totalSlides <= 1) return;
          const normalizedIndex = (nextIndex + totalSlides) % totalSlides;
          const token = slideChangeTokenRef.current + 1;
          slideChangeTokenRef.current = token;
          const nextImage = normalizedIndex < images.length
            ? images[normalizedIndex]?.image_url
            : null;
          const nextVideo = normalizedIndex >= images.length
            ? videos[0]?.video_url
            : null;

          const nextMediaReady = nextVideo
            ? preloadVideo(nextVideo)
            : preloadImage(nextImage ? cdnFull(nextImage) : null);

          nextMediaReady
            .catch(() => undefined)
            .then(() => {
              if (slideChangeTokenRef.current === token) {
                setActiveImageIndex(normalizedIndex);
              }
            });
        },
        [images, totalSlides, videos]
      );

      const handleImageTap = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
          if (expanded) return;
          if (totalSlides <= 1) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const tapX = e.clientX - rect.left;
          const half = rect.width / 2;
          showSlide(tapX > half ? activeImageIndex + 1 : activeImageIndex - 1);
        },
        [activeImageIndex, expanded, showSlide, totalSlides]
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

      useEffect(() => {
        setActiveImageIndex(0);
        slideChangeTokenRef.current = 0;
        x.set(0);
        y.set(0);
      }, [item?.id, x, y]);

      useEffect(() => {
        if (standby) return;

        const fullImages = images.map((image: any) => cdnFull(image?.image_url));
        const blurImages = images.map((image: any) => cdnBlur(image?.image_url));
        const videoUrls = videos.map((video: any) => video?.video_url);

        preloadImages([...fullImages, ...blurImages]).catch(() => undefined);
        preloadVideos(videoUrls).catch(() => undefined);
      }, [images, standby, videos]);

      const doExit = useCallback(
        (direction: "like" | "dislike", velocityX?: number) => {
          if (disabled || standby || expanded) return;
          const exitX = direction === "like" ? EXIT_X : -EXIT_X;
          const vel = velocityX != null ? velocityX : direction === "like" ? 800 : -800;
          animate(y, EXIT_Y, {
            type: "spring",
            stiffness: 520,
            damping: 38,
            velocity: Math.abs(vel) * 0.18,
          });
          animate(x, exitX, {
            type: "spring",
            stiffness: 600,
            damping: 35,
            velocity: vel,
            restSpeed: 100,
            onComplete: () => onSwipeComplete(direction),
          });
        },
        [disabled, standby, expanded, x, y, onSwipeComplete]
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
            animate(y, 0, { type: "spring", stiffness: 700, damping: 28, mass: 0.8 });
          }
        },
        [doExit, x, y, expanded]
      );

      const ownerProfile = item?.profiles as any;
      const conditionLabel = translateCondition(item?.condition);
      const compactLocation = formatCompactLocation(item?.location);
      const { data: rating } = useUserRating(ownerProfile?.user_id);

      return (
        <motion.div
          className={`absolute inset-0 w-full h-full ${
            standby ? "pointer-events-none" : expanded ? "" : "touch-none"
          }`}
          style={{
            x: standby ? 0 : x,
            rotate: standby || expanded ? 0 : rotate,
            scale: standby ? standbyScale : expanded ? 1 : liftScale,
            boxShadow: standby || expanded ? undefined : liftShadow,
            zIndex: standby ? 9 : 60,
            willChange: standby ? "auto" : "transform",
            transformOrigin: "50% 80%",
            borderRadius: "0 0 1.5rem 1.5rem",
            y: standby ? 0 : y,
            ...(standby ? { opacity: standbyOpacity } : {}),
          }}
          drag={standby || expanded ? false : "x"}
          dragDirectionLock
          dragConstraints={{ top: 0, bottom: 0, left: -500, right: 500 }}
          dragElastic={{ top: 0, bottom: 0, left: 0.65, right: 0.65 }}
          onDragEnd={standby || expanded ? undefined : handleDragEnd}
          initial={standby ? false : { scale: 1, opacity: 1 }}
          animate={undefined}
        >
          {/* Liquid glass border — blurred image reflection */}
          {currentImage && (
            <div
              className="absolute -inset-[3px] rounded-t-none rounded-b-[1.65rem] overflow-hidden z-0"
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
              className="absolute -inset-[3px] rounded-t-none rounded-b-[1.65rem] overflow-hidden z-0 bg-border dark:bg-primary/30"
              aria-hidden
            />
          )}

          {/* Inner card */}
          <div className="absolute inset-0 rounded-t-none rounded-b-[1.5rem] overflow-hidden z-[1] shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-none">
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
                  preload="auto"
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

            {/* Share + filters */}
            {!expanded && (
              <div className="absolute top-4 right-4 z-30 flex flex-col items-center gap-2">
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
                {onOpenFilters && !standby && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFilters();
                    }}
                    className="relative h-8 w-8 rounded-full bg-scrim/30 backdrop-blur-xl border border-on-media/10 flex items-center justify-center"
                    aria-label="Configurar interesses"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-on-media" />
                    {hasActiveFilters && (
                      <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-primary ring-1 ring-scrim/70" />
                    )}
                  </button>
                )}
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
                    showSlide(activeImageIndex - 1);
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 right-0 w-1/2 z-[25]"
                  onClick={(e) => {
                    e.stopPropagation();
                    showSlide(activeImageIndex + 1);
                  }}
                />
              </>
            )}

            {expanded && (
              <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20 h-full bg-gradient-to-t from-black/88 via-black/58 to-black/18" />
            )}

            {/* ===== EXPANDED OVERLAY ===== */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute inset-x-3 bottom-3 top-[18%] z-30 flex flex-col rounded-2xl bg-black/64 backdrop-blur-2xl border border-white/16 shadow-[0_18px_60px_rgba(0,0,0,0.42)] overflow-hidden"
                >
                  <button
                    onClick={toggleExpand}
                    className="w-full flex justify-center items-center gap-1 pt-4 pb-2 text-white/72 shrink-0"
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
                              src={cdnThumb(matchedOwnItem.image_url)}
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
                className="absolute bottom-0 inset-x-0 z-30 max-h-[280px] rounded-b-[1.5rem] overflow-hidden pointer-events-none"
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  height: "38%",
                  minHeight: "220px",
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.10) 24%, rgba(0,0,0,0.44) 58%, rgba(0,0,0,0.88) 100%)",
                }}
              >
                <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pointer-events-none">
                  {matchedOwnItem && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Repeat className="h-3 w-3 text-primary shrink-0" />
                      {matchedOwnItem.image_url ? (
                        <img
                          src={cdnThumb(matchedOwnItem.image_url)}
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

                  <button
                    type="button"
                    onClick={toggleExpand}
                    aria-label="Ver detalhes do item"
                    className="block w-full text-left pointer-events-auto active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center gap-1.5 mb-2.5 overflow-hidden">
                      <span className="px-2 py-0.5 rounded-full bg-black/30 border border-white/12 text-white/94 text-[9.5px] font-semibold tracking-wide uppercase shrink-0 backdrop-blur-xl">
                        {item.category}
                      </span>
                      {conditionLabel && (
                        <span className="px-2 py-0.5 rounded-full bg-black/30 border border-white/12 text-white/90 text-[9.5px] font-semibold uppercase flex items-center gap-1 shrink-0 backdrop-blur-xl">
                          <Package className="h-2.5 w-2.5" /> {conditionLabel}
                        </span>
                      )}
                      {compactLocation && (
                        <span className="max-w-[48%] px-2 py-0.5 rounded-full bg-black/30 border border-white/12 text-white/90 text-[9.5px] font-semibold uppercase flex items-center gap-1 truncate min-w-0 backdrop-blur-xl">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />{" "}
                          <span className="truncate">{compactLocation}</span>
                        </span>
                      )}
                    </div>

                    <h2 className="pb-0.5 text-white text-[24px] font-bold tracking-tight leading-[1.12] truncate [text-shadow:0_1px_2px_rgba(0,0,0,0.46)]">
                      {item.name}
                    </h2>

                    <span className="mt-1 inline-flex items-center gap-2">
                      <span className="text-white/92 text-[15.5px] font-medium tracking-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.42)]">
                        {formatValue(item.market_value)}
                      </span>
                      <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-white/8 text-white/56 backdrop-blur-xl">
                        <ChevronDown className="h-2.5 w-2.5" />
                      </span>
                    </span>
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
