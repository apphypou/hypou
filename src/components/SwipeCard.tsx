import {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useState,
  useEffect,
  useRef,
  memo,
  useMemo,
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
import { buildPublicItemUrl, shareContent } from "@/lib/share";
import { getMediaObjectPosition } from "@/lib/mediaFrame";
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

const getMediaAspectClass = (ratio?: number) => {
  if (!ratio) return "swipe-media-stage--balanced";
  if (ratio >= 1.22) return "swipe-media-stage--wide";
  if (ratio <= 0.78) return "swipe-media-stage--tall";
  return "swipe-media-stage--balanced";
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
      const images = useMemo(() => item?.item_images || [], [item?.item_images]);
      const videos = useMemo(() => item?.item_videos || [], [item?.item_videos]);
      const hasVideo = videos.length > 0;
      const totalSlides = images.length + (hasVideo ? 1 : 0);
      const [activeImageIndex, setActiveImageIndex] = useState(0);
      const isVideoSlide = hasVideo && activeImageIndex === images.length;
      const currentImage = !isVideoSlide ? images[activeImageIndex]?.image_url : null;
      const currentImageRecord = !isVideoSlide ? images[activeImageIndex] : null;
      const currentVideo = isVideoSlide ? videos[0]?.video_url : null;
      const currentVideoPoster = isVideoSlide
        ? videos[0]?.thumbnail_url || images[Math.max(images.length - 1, 0)]?.image_url
        : null;
      const [videoReady, setVideoReady] = useState(false);
      const [imageRatios, setImageRatios] = useState<Record<string, number>>({});
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

      const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
        const image = event.currentTarget;
        const source = image.currentSrc || image.src;
        if (!source || !image.naturalWidth || !image.naturalHeight) return;
        const ratio = image.naturalWidth / image.naturalHeight;
        setImageRatios((previous) => (
          previous[source] === ratio ? previous : { ...previous, [source]: ratio }
        ));
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
        setVideoReady(false);
        slideChangeTokenRef.current = 0;
        x.set(0);
        y.set(0);
      }, [item?.id, x, y]);

      useEffect(() => {
        setVideoReady(false);
      }, [currentVideo]);

      useEffect(() => {
        if (standby) return;

        const fullImages = images.map((image: any) => cdnFull(image?.image_url));
        const blurImages = images.map((image: any) => cdnBlur(image?.image_url));
        const videoUrls = videos.map((video: any) => video?.video_url);

        preloadImages([...fullImages, ...blurImages]).catch(() => undefined);
        preloadVideos(videoUrls).catch(() => undefined);
      }, [images, standby, videos]);

      const revealVideoWhenFrameIsReady = useCallback((video: HTMLVideoElement) => {
        if ("requestVideoFrameCallback" in video) {
          video.requestVideoFrameCallback(() => setVideoReady(true));
          return;
        }

        requestAnimationFrame(() => setVideoReady(true));
      }, []);

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
      const currentImageSrc = currentImage ? cdnFull(currentImage) : null;
      const mediaAspectClass = getMediaAspectClass(currentImageSrc ? imageRatios[currentImageSrc] : undefined);

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
            borderRadius: 0,
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
          {/* Inner card */}
          <div className="absolute inset-0 overflow-hidden z-[1]">
            {!standby && !expanded && <SwipeOverlays x={x} />}

            {/* ===== FULL IMAGE / VIDEO ===== */}
            <div
              className="absolute inset-0 w-full h-full"
              onClick={standby ? undefined : handleImageTap}
            >
              {isVideoSlide && currentVideo ? (
                <>
                  {currentVideoPoster ? (
                    <img
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      src={cdnFull(currentVideoPoster)}
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                  <video
                    ref={videoRef}
                    key={`video-${currentVideo}`}
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-150 ${
                      videoReady ? "opacity-100" : "opacity-0"
                    }`}
                    src={currentVideo}
                    poster={currentVideoPoster ? cdnFull(currentVideoPoster) : undefined}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    draggable={false}
                    onLoadedData={(event) => revealVideoWhenFrameIsReady(event.currentTarget)}
                    onCanPlay={(event) => revealVideoWhenFrameIsReady(event.currentTarget)}
                    onPlaying={(event) => revealVideoWhenFrameIsReady(event.currentTarget)}
                  />
                </>
              ) : currentImage ? (
                <div className={`swipe-media-stage ${mediaAspectClass}`}>
                  <img
                    src={cdnBlur(currentImage)}
                    alt=""
                    aria-hidden
                    className="swipe-media-ambient"
                    draggable={false}
                  />
                  <div className="swipe-media-ambient-scrim" aria-hidden />
                  <img
                    key={activeImageIndex}
                    alt={item.name}
                    className="swipe-media-foreground"
                    src={currentImageSrc || undefined}
                    style={{ objectPosition: getMediaObjectPosition(currentImageRecord) }}
                    onLoad={handleImageLoad}
                    draggable={false}
                  />
                </div>
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
                className="absolute left-4 z-30 flex items-center gap-1.5 max-w-[45%] pl-1 pr-2.5 py-1 rounded-full bg-scrim/35 backdrop-blur-xl border border-on-media/10 hover:border-on-media/30 active:scale-95 transition-all cursor-pointer"
                style={{ top: "calc(var(--safe-area-top) + 0.75rem)" }}
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
              <div
                className="absolute left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-scrim/30 backdrop-blur-xl border border-on-media/10"
                style={{ top: "calc(var(--safe-area-top) + 2.85rem)" }}
              >
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
              <div
                className="absolute right-4 z-30 flex flex-col items-center gap-2"
                style={{ top: "calc(var(--safe-area-top) + 0.75rem)" }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void shareContent({
                      title: `${item.name} — Hypou`,
                      text: `Olha esse item no Hypou: ${item.name} por ${formatValue(item.market_value)}! Quer trocar?`,
                      url: buildPublicItemUrl(item.id),
                    }).catch((error) => {
                      if (error?.name !== "AbortError") console.error("Falha ao compartilhar item", error);
                    });
                  }}
                  aria-label="Compartilhar item"
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

            {/* Dark glass edge fade */}
            <div
              className="swipe-edge-glass swipe-edge-glass-top z-20"
              aria-hidden
            />

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
              <div
                className="swipe-edge-glass swipe-edge-glass-bottom swipe-edge-glass-bottom-expanded z-20"
                aria-hidden
              />
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
                className="absolute bottom-0 inset-x-0 z-30 h-[46%] min-h-[270px] max-h-[360px] overflow-hidden pointer-events-none"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div
                  className="swipe-edge-glass swipe-edge-glass-bottom swipe-edge-glass-bottom-compact swipe-edge-glass-fill z-0"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-[calc(var(--safe-area-bottom)+5.75rem)] pointer-events-none">
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
                    <div className="flex min-w-0 items-end gap-3 border-b border-white/75 pb-2">
                      <h2 className="min-w-0 flex-1 truncate text-white text-[24px] font-bold tracking-tight leading-[1.12] [text-shadow:0_1px_2px_rgba(0,0,0,0.46)]">
                        {item.name}
                      </h2>
                      <span className="shrink-0 text-white text-[19px] font-semibold leading-none tracking-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.46)]">
                        {formatValue(item.market_value)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5 mb-1.5 overflow-hidden">
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
