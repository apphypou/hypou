import {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  memo,
  useMemo,
  type Touch,
  type TouchEvent,
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRating } from "@/hooks/useRatings";
import { formatValue, translateCondition } from "@/lib/utils";
import { cdnFull, cdnBlur, cdnThumb } from "@/lib/imageUrl";
import { preloadImage, preloadVideo } from "@/lib/mediaPreload";
import { measureImageTone, type MediaTone } from "@/lib/mediaContrast";
import { getMediaObjectPosition, getMediaScale } from "@/lib/mediaFrame";
import { haptic } from "@/lib/haptics";
import { CardDetailContent } from "./SwipeCard/CardDetailContent";
import { SwipeActionButtons } from "./SwipeCard/SwipeActionButtons";
import { SwipeOverlays } from "./SwipeCard/SwipeOverlays";

const CARD_SWIPE_THRESHOLD = 80;
const MAX_MEDIA_ZOOM = 4;

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
}

type MediaZoom = {
  scale: number;
  x: number;
  y: number;
};

const getTouchDistance = (first: Touch, second: Touch) =>
  Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);

const clampMediaPan = (value: number, viewportSize: number, scale: number) => {
  const limit = (viewportSize * (scale - 1)) / 2;
  return Math.min(limit, Math.max(-limit, value));
};

const SwipeCard = memo(
  forwardRef<SwipeCardHandle, SwipeCardProps>(
    (
      { item, onSwipeComplete, onDragDirectionChange, disabled, standby, revealMotionX, matchedOwnItem },
      ref
    ) => {
      const navigate = useNavigate();
      const x = useMotionValue(0);
      const y = useMotionValue(0);
      const rotate = useTransform(x, [-300, 0, 300], [-4, 0, 4]);
      const revealSource = revealMotionX ?? x;
      const revealProgress = useTransform(revealSource, (value) =>
        Math.min(Math.abs(value) / (CARD_SWIPE_THRESHOLD * 2), 1)
      );
      const standbyOpacity = useTransform(revealProgress, [0, 1], [0, 1]);
      const standbyScale = useTransform(revealProgress, [0, 1], [0.99, 1]);

      // 3D lift effect — card pops out as it's dragged
      const absX = useTransform(x, (v) => Math.abs(v));
      const liftScale = useTransform(absX, [0, 300], [1, 1.01]);

      // Image + video gallery state
      const images = useMemo(() => item?.item_images || [], [item?.item_images]);
      const videos = useMemo(() => item?.item_videos || [], [item?.item_videos]);
      const hasVideo = videos.length > 0;
      const totalSlides = images.length + (hasVideo ? 1 : 0);
      const [activeImageIndex, setActiveImageIndex] = useState(0);
      const activeImageIndexRef = useRef(0);
      const slideRequestRef = useRef(0);
      const [galleryStatus, setGalleryStatus] = useState<"idle" | "loading" | "error">("idle");
      const [imageRevision, setImageRevision] = useState(0);
      const mediaRef = useRef<HTMLDivElement>(null);
      const compactInfoRef = useRef<HTMLDivElement>(null);
      const [compactInfoHeight, setCompactInfoHeight] = useState(260);
      const [mediaSize, setMediaSize] = useState({ width: 0, height: 0, centerY: 0 });
      const isVideoSlide = hasVideo && activeImageIndex === images.length;
      const currentImageRecord = !isVideoSlide ? images[activeImageIndex] : null;
      const currentImage = !isVideoSlide ? images[activeImageIndex]?.image_url : null;
      const hasCurrentImage = Boolean(currentImage);
      const backgroundImage = images[0]?.image_url ?? null;
      const currentVideo = isVideoSlide ? videos[0]?.video_url : null;
      const currentVideoPoster = isVideoSlide
        ? videos[0]?.thumbnail_url || images[Math.max(images.length - 1, 0)]?.image_url
        : null;
      const [videoReady, setVideoReady] = useState(false);
      const [imageRatios, setImageRatios] = useState<Record<string, number>>({});
      const [mediaTone, setMediaTone] = useState<MediaTone>("neutral");
      const videoRef = useRef<HTMLVideoElement>(null);
      const exitingRef = useRef(false);
      const hapticDirectionRef = useRef<"like" | "dislike" | null>(null);

      // Expanded state
      const [expanded, setExpanded] = useState(false);
      const scrollRef = useRef<HTMLDivElement>(null);
      const [mediaZoom, setMediaZoom] = useState<MediaZoom>({ scale: 1, x: 0, y: 0 });
      const [isMediaGestureActive, setIsMediaGestureActive] = useState(false);
      const mediaZoomRef = useRef(mediaZoom);
      const mediaGestureRef = useRef({
        pinchDistance: 0,
        pinchScale: 1,
        panStartX: 0,
        panStartY: 0,
        panOriginX: 0,
        panOriginY: 0,
        pinching: false,
        panning: false,
      });
      const suppressImageTapRef = useRef(false);

      const updateMediaZoom = useCallback((next: MediaZoom) => {
        mediaZoomRef.current = next;
        setMediaZoom(next);
      }, []);

      const resetMediaZoom = useCallback(() => {
        mediaGestureRef.current.pinching = false;
        mediaGestureRef.current.panning = false;
        updateMediaZoom({ scale: 1, x: 0, y: 0 });
        setIsMediaGestureActive(false);
      }, [updateMediaZoom]);

      const showSlide = useCallback(
        (nextIndex: number) => {
          if (mediaZoomRef.current.scale > 1.01) return;
          if (!totalSlides) return;
          const normalizedIndex = (nextIndex + totalSlides) % totalSlides;
          const request = ++slideRequestRef.current;
          activeImageIndexRef.current = normalizedIndex;
          setGalleryStatus("loading");
          const nextImage = normalizedIndex < images.length
            ? images[normalizedIndex]?.image_url
            : null;
          const nextVideo = normalizedIndex >= images.length
            ? videos[0]?.video_url
            : null;

          const nextMediaReady = nextVideo
            ? preloadVideo(nextVideo)
            : preloadImage(nextImage ? cdnFull(nextImage) : null, "anonymous");
          void nextMediaReady.then(() => {
            if (request !== slideRequestRef.current) return;
            setActiveImageIndex(normalizedIndex);
            setImageRevision((revision) => revision + 1);
            setGalleryStatus("idle");
          }).catch(() => {
            if (request === slideRequestRef.current) setGalleryStatus("error");
          });
        },
        [images, totalSlides, videos]
      );

      const handleImageTap = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
          if (suppressImageTapRef.current || mediaZoomRef.current.scale > 1.01) return;
          if (expanded) return;
          if (totalSlides <= 1) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const tapX = e.clientX - rect.left;
          const half = rect.width / 2;
          showSlide(tapX > half ? activeImageIndexRef.current + 1 : activeImageIndexRef.current - 1);
        },
        [expanded, showSlide, totalSlides]
      );

      const toggleExpand = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        resetMediaZoom();
        setExpanded((v) => !v);
      }, [resetMediaZoom]);

      const handleMediaTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
        if (isVideoSlide || standby) return;
        const gesture = mediaGestureRef.current;

        if (event.touches.length === 2) {
          event.preventDefault();
          event.stopPropagation();
          gesture.pinchDistance = getTouchDistance(event.touches[0], event.touches[1]);
          gesture.pinchScale = mediaZoomRef.current.scale;
          gesture.pinching = true;
          gesture.panning = false;
          suppressImageTapRef.current = true;
          setIsMediaGestureActive(true);
          x.set(0);
          y.set(0);
          return;
        }

        if (event.touches.length === 1 && mediaZoomRef.current.scale > 1.01) {
          const touch = event.touches[0];
          gesture.panStartX = touch.clientX;
          gesture.panStartY = touch.clientY;
          gesture.panOriginX = mediaZoomRef.current.x;
          gesture.panOriginY = mediaZoomRef.current.y;
          gesture.panning = true;
          setIsMediaGestureActive(true);
        }
      }, [isVideoSlide, standby, x, y]);

      const handleMediaTouchMove = useCallback((event: TouchEvent<HTMLDivElement>) => {
        if (isVideoSlide || standby) return;
        const gesture = mediaGestureRef.current;

        if (event.touches.length === 2 && gesture.pinching) {
          event.preventDefault();
          event.stopPropagation();
          const distance = getTouchDistance(event.touches[0], event.touches[1]);
          const scale = Math.min(
            MAX_MEDIA_ZOOM,
            Math.max(1, gesture.pinchScale * (distance / gesture.pinchDistance)),
          );
          const stage = event.currentTarget;
          updateMediaZoom({
            scale,
            x: clampMediaPan(mediaZoomRef.current.x, stage.clientWidth, scale),
            y: clampMediaPan(mediaZoomRef.current.y, stage.clientHeight, scale),
          });
          return;
        }

        if (event.touches.length === 1 && gesture.panning && mediaZoomRef.current.scale > 1.01) {
          event.preventDefault();
          event.stopPropagation();
          const touch = event.touches[0];
          const stage = event.currentTarget;
          const scale = mediaZoomRef.current.scale;
          updateMediaZoom({
            scale,
            x: clampMediaPan(gesture.panOriginX + touch.clientX - gesture.panStartX, stage.clientWidth, scale),
            y: clampMediaPan(gesture.panOriginY + touch.clientY - gesture.panStartY, stage.clientHeight, scale),
          });
        }
      }, [isVideoSlide, standby, updateMediaZoom]);

      const handleMediaTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
        const gesture = mediaGestureRef.current;

        if (event.touches.length === 1 && mediaZoomRef.current.scale > 1.01) {
          const touch = event.touches[0];
          gesture.pinching = false;
          gesture.panning = true;
          gesture.panStartX = touch.clientX;
          gesture.panStartY = touch.clientY;
          gesture.panOriginX = mediaZoomRef.current.x;
          gesture.panOriginY = mediaZoomRef.current.y;
          return;
        }

        if (event.touches.length > 0) return;
        gesture.pinching = false;
        gesture.panning = false;
        setIsMediaGestureActive(false);
        window.setTimeout(() => {
          suppressImageTapRef.current = false;
        }, 180);

        if (mediaZoomRef.current.scale < 1.05) resetMediaZoom();
      }, [resetMediaZoom]);

      const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
        const image = event.currentTarget;
        const source = image.getAttribute("src") || image.currentSrc || image.src;
        if (!source || !image.naturalWidth || !image.naturalHeight) return;
        const ratio = image.naturalWidth / image.naturalHeight;
        setImageRatios((previous) => (
          previous[source] === ratio ? previous : { ...previous, [source]: ratio }
        ));
        setMediaTone(measureImageTone(event.currentTarget));
      }, []);

      const handleBackgroundError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
        const fallback = backgroundImage ? cdnFull(backgroundImage) : "";
        if (fallback && event.currentTarget.getAttribute("src") !== fallback) event.currentTarget.src = fallback;
      }, [backgroundImage]);

      useEffect(() => {
        if (disabled || standby) return;
        const unsubscribe = x.on("change", (latest) => {
          onDragDirectionChange?.(latest);
          const direction = latest >= CARD_SWIPE_THRESHOLD
            ? "like"
            : latest <= -CARD_SWIPE_THRESHOLD
              ? "dislike"
              : null;
          if (direction && direction !== hapticDirectionRef.current) {
            hapticDirectionRef.current = direction;
            void haptic("light");
          } else if (Math.abs(latest) < CARD_SWIPE_THRESHOLD * 0.7) {
            hapticDirectionRef.current = null;
          }
        });
        return unsubscribe;
      }, [x, disabled, standby, onDragDirectionChange]);

      useLayoutEffect(() => {
        const media = mediaRef.current;
        const info = compactInfoRef.current;
        if (typeof ResizeObserver === "undefined") return;
        const measure = () => {
          if (media) setMediaSize({
            width: media.clientWidth,
            height: media.clientHeight,
            centerY: (media.clientHeight + (expanded ? 0 : 44)) / 2,
          });
          if (info) setCompactInfoHeight(info.offsetHeight);
        };
        measure();
        const observer = new ResizeObserver(measure);
        if (media) observer.observe(media);
        if (info) observer.observe(info);
        return () => observer.disconnect();
      }, [expanded, isVideoSlide, hasCurrentImage]);

      useEffect(() => {
        ++slideRequestRef.current;
        setGalleryStatus("idle");
        setActiveImageIndex(0);
        activeImageIndexRef.current = 0;
        setVideoReady(false);
        setMediaTone("neutral");
        exitingRef.current = false;
        hapticDirectionRef.current = null;
        x.set(0);
        y.set(0);
        return () => {
          ++slideRequestRef.current;
          x.stop();
          y.stop();
        };
      }, [item?.id, x, y]);

      useEffect(() => {
        resetMediaZoom();
      }, [activeImageIndex, resetMediaZoom]);

      useEffect(() => {
        setVideoReady(false);
        setMediaTone("neutral");
      }, [currentVideo]);

      useEffect(() => {
        if (standby) return;

        preloadImage(backgroundImage ? cdnBlur(backgroundImage) : null, "anonymous").catch(() => undefined);
        // Prepare both directions, without retaining every photo of every item.
        for (const offset of [-1, 1]) {
          const index = (activeImageIndex + offset + totalSlides) % totalSlides;
          if (index === images.length && hasVideo) {
            preloadVideo(videos[0]?.video_url).catch(() => undefined);
          } else {
            preloadImage(images[index]?.image_url ? cdnFull(images[index].image_url) : null, "anonymous").catch(() => undefined);
          }
        }
      }, [activeImageIndex, backgroundImage, hasVideo, images, standby, totalSlides, videos]);

      const revealVideoWhenFrameIsReady = useCallback((video: HTMLVideoElement) => {
        if ("requestVideoFrameCallback" in video) {
          video.requestVideoFrameCallback(() => setVideoReady(true));
          return;
        }

        requestAnimationFrame(() => setVideoReady(true));
      }, []);

      const doExit = useCallback(
        (direction: "like" | "dislike", velocity?: PanInfo["velocity"]) => {
          if (disabled || standby || expanded || mediaZoomRef.current.scale > 1.01 || exitingRef.current) return;
          exitingRef.current = true;
          // Clear even wide screens and the rotated corner. Don't wait for a
          // spring to settle offscreen before making the next card interactive.
          const sign = direction === "like" ? 1 : -1;
          const moving = velocity && Math.hypot(velocity.x, velocity.y) > 100 && velocity.x * sign > 0;
          const vector = moving ? velocity : velocity ? { x: x.get(), y: y.get() } : { x: sign, y: 1 };
          const length = Math.hypot(vector.x, vector.y) || 1;
          const dx = vector.x / length;
          const dy = vector.y / length;
          const margin = 64;
          const distance = Math.max(0, Math.min(
            dx ? (window.innerWidth + margin - Math.sign(dx) * x.get()) / Math.abs(dx) : Infinity,
            dy ? (window.innerHeight + margin - Math.sign(dy) * y.get()) / Math.abs(dy) : Infinity,
          ));
          const exitX = x.get() + dx * distance;
          const exitY = y.get() + dy * distance;
          const speed = velocity ? Math.max(0, velocity.x * dx + velocity.y * dy) : 900;
          const duration = Math.min(0.32, Math.max(0.12, distance / Math.max(speed, 1400)));
          const ease: [number, number, number, number] = [1 / 3, Math.min(1, speed * duration / Math.max(distance, 1) / 3), 2 / 3, 1];
          animate(x, exitX, {
            type: "tween",
            duration,
            // Match the release velocity at t=0, then accelerate out of view.
            ease,
            onComplete: () => onSwipeComplete(direction),
          });
          animate(y, exitY, { type: "tween", duration, ease });
        },
        [disabled, standby, expanded, x, y, onSwipeComplete]
      );

      useImperativeHandle(ref, () => ({
        triggerSwipe: (dir) => doExit(dir),
      }));

      const handleDragEnd = useCallback(
        (_: any, info: PanInfo) => {
          if (expanded || mediaZoomRef.current.scale > 1.01) return;
          const velocity = info.velocity.x;
          const offset = x.get();

          if (Math.abs(velocity) > 400 && Math.abs(info.offset.x) > 12) {
            doExit(velocity > 0 ? "like" : "dislike", info.velocity);
          } else if (offset > CARD_SWIPE_THRESHOLD) {
            doExit("like", info.velocity);
          } else if (offset < -CARD_SWIPE_THRESHOLD) {
            doExit("dislike", info.velocity);
          } else {
            animate(x, 0, { type: "spring", stiffness: 650, damping: 45, mass: 0.8, velocity });
            animate(y, 0, { type: "spring", stiffness: 650, damping: 45, mass: 0.8, velocity: info.velocity.y });
          }
        },
        [doExit, x, y, expanded]
      );

      const ownerProfile = item?.profiles as any;
      const conditionLabel = translateCondition(item?.condition);
      const compactLocation = formatCompactLocation(item?.location);
      const { data: rating } = useUserRating(ownerProfile?.user_id);
      const currentImageSrc = currentImage ? cdnFull(currentImage) : null;
      const imageRatio = currentImageSrc ? imageRatios[currentImageSrc] : undefined;
      const fillPhotoWidth = !expanded && Boolean(imageRatio && mediaSize.width / imageRatio > mediaSize.height);
      const fittedWidth = imageRatio ? (fillPhotoWidth ? mediaSize.width : Math.min(mediaSize.width, mediaSize.height * imageRatio)) : 0;
      const fittedHeight = imageRatio ? Math.min(mediaSize.height, fittedWidth / imageRatio) : 0;
      const imageMaskSize = fittedWidth && fittedHeight ? `${fittedWidth}px ${fittedHeight}px` : "100% 100%";
      const freeHeight = mediaSize.height - fittedHeight;
      // Balance the photo between the 44px header controls and product information.
      const centeredY = fittedHeight && freeHeight > 0
        ? Math.max(0, Math.min(100, (mediaSize.centerY - fittedHeight / 2) / freeHeight * 100))
        : 50;
      const imagePosition = expanded ? getMediaObjectPosition(currentImageRecord) : `50% ${centeredY}%`;
      const backgroundImageSrc = backgroundImage ? cdnFull(backgroundImage) : null;
      const backgroundAspectClass = getMediaAspectClass(
        backgroundImageSrc ? imageRatios[backgroundImageSrc] : undefined
      );

      return (
        <>
        {/* Stationary, already decoded backgrounds: only opacity changes during
            the gesture; the existing blur, framing and scrim stay unchanged. */}
        {backgroundImage && (
          <motion.div
            aria-hidden
            className="swipe-card-backdrop pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem] bg-background"
            style={{ zIndex: standby ? 1 : 0, opacity: standby ? standbyOpacity : 1, willChange: "opacity" }}
          >
            <div className={`swipe-media-stage ${backgroundAspectClass}`}>
              <img src={cdnBlur(backgroundImage)} onError={handleBackgroundError} alt="" crossOrigin="anonymous" className="swipe-media-ambient" loading="eager" decoding="async" draggable={false} />
              <div className="swipe-media-ambient-scrim" />
            </div>
          </motion.div>
        )}
        <motion.div
          aria-hidden={standby || undefined}
          data-media-tone={mediaTone}
          className={`swipe-card-shell absolute inset-0 h-full w-full overflow-hidden rounded-[1.75rem] ${
            standby ? "pointer-events-none" : expanded ? "" : "touch-none"
          }`}
          style={{
            x: standby ? 0 : x,
            y: standby ? 0 : y,
            rotate: standby || expanded ? 0 : rotate,
            scale: standby ? standbyScale : expanded ? 1 : liftScale,
            boxShadow: standby || expanded ? undefined : "0 18px 36px -12px rgba(0,0,0,0.42)",
            zIndex: standby ? 9 : expanded ? 80 : 60,
            willChange: "transform, opacity",
            transformOrigin: "50% 80%",
            borderRadius: "1.75rem",
            ...(standby ? { opacity: standbyOpacity } : {}),
          }}
          drag={!(disabled || standby || expanded || isMediaGestureActive || mediaZoom.scale > 1.01)}
          dragMomentum={false}
          onPointerDownCapture={(event) => {
            if (exitingRef.current) event.stopPropagation();
          }}
          onDragEnd={standby || expanded ? undefined : handleDragEnd}
          initial={standby ? false : { scale: 1, opacity: 1 }}
          animate={undefined}
        >
          {/* Inner card */}
          <div className="absolute inset-0 z-[1] overflow-hidden rounded-[inherit]">
            {!standby && !expanded && <SwipeOverlays x={x} />}

            {/* ===== FULL IMAGE / VIDEO ===== */}
            <div
              className="absolute inset-0 h-full w-full touch-none"
              onClick={standby ? undefined : handleImageTap}
              onTouchStart={handleMediaTouchStart}
              onTouchMove={handleMediaTouchMove}
              onTouchEnd={handleMediaTouchEnd}
              onTouchCancel={handleMediaTouchEnd}
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
                <div className={`swipe-media-stage ${backgroundAspectClass}`}>
                  <img
                    src={cdnBlur(backgroundImage)}
                    onError={handleBackgroundError}
                    alt=""
                    aria-hidden
                    crossOrigin="anonymous"
                    className="swipe-media-ambient"
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                  <div className="swipe-media-ambient-scrim" aria-hidden />
                  <div
                    ref={mediaRef}
                    className="swipe-photo-viewport absolute inset-x-0 overflow-hidden"
                    style={{
                      top: expanded ? 0 : "var(--safe-area-top)",
                      bottom: expanded ? 0 : compactInfoHeight + 8,
                    }}
                  >
                  <img
                    key={`${activeImageIndex}-${imageRevision}`}
                    alt={item.name}
                    className="swipe-media-foreground"
                    src={currentImageSrc || undefined}
                    crossOrigin="anonymous"
                    fetchPriority={standby ? "auto" : "high"}
                    loading="eager"
                    decoding="async"
                    style={{
                      objectFit: fillPhotoWidth ? "cover" : "contain",
                      objectPosition: imagePosition,
                      transformOrigin: imagePosition,
                      maskSize: imageMaskSize,
                      WebkitMaskSize: imageMaskSize,
                      maskPosition: imagePosition,
                      WebkitMaskPosition: imagePosition,
                      transform: `translate3d(${mediaZoom.x}px, ${mediaZoom.y}px, 0) scale(${getMediaScale(currentImageRecord) * mediaZoom.scale})`,
                      willChange: "transform",
                    }}
                    onLoad={handleImageLoad}
                    onError={() => {
                      activeImageIndexRef.current = activeImageIndex;
                      setGalleryStatus("error");
                    }}
                    draggable={false}
                  />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Image className="h-16 w-16 text-foreground/10" />
                </div>
              )}
            </div>

            {!standby && !expanded && galleryStatus !== "idle" && (
              <div className="absolute inset-x-4 z-30 flex justify-center" style={{ top: "calc(var(--safe-area-top) + 5.5rem)" }}>
                {galleryStatus === "error" ? (
                  <button type="button" className="min-h-11 rounded-full bg-black/80 px-4 text-xs text-white"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => showSlide(activeImageIndexRef.current)}>
                    Não foi possível carregar. Tentar novamente
                  </button>
                ) : <span role="status" className="rounded-full bg-black/80 px-3 py-2 text-xs text-white">Carregando foto…</span>}
              </div>
            )}

            {/* Owner mini-profile */}
            {ownerProfile && !expanded && (
              <button
                disabled={standby}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/usuario/${ownerProfile.user_id}`);
                }}
                className="swipe-owner-button absolute left-4 z-30 flex items-center gap-1.5 max-w-[calc(50%-4.5rem)] pl-1 pr-2.5 py-1 rounded-full bg-scrim/65 border border-on-media/10 hover:border-on-media/30 active:scale-95 transition-all cursor-pointer"
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
                  {(ownerProfile.display_name || "Usuário").trim().split(/\s+/)[0]}
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
              <button
                type="button"
                disabled={standby}
                aria-label={`Fotos do item: ${activeImageIndex + 1} de ${totalSlides}. Próxima foto`}
                onClick={() => showSlide(activeImageIndexRef.current + 1)}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                  event.preventDefault();
                  showSlide(activeImageIndexRef.current + (event.key === "ArrowRight" ? 1 : -1));
                }}
                onPointerDown={(event) => event.stopPropagation()}
                className="absolute left-1/2 -translate-x-1/2 z-30 flex h-11 min-w-11 items-center gap-0 px-1"
                style={{ top: "calc(var(--safe-area-top) + 0.3rem)" }}
              >
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-[17px] h-2.5 rounded-full bg-black/40" />
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="relative flex h-11 min-w-2.5 items-center justify-center"
                  >
                    <span className={`h-1 rounded-full transition-all duration-200 ${
                      i === activeImageIndex ? "w-3.5 bg-on-media" : "w-1 bg-on-media/40"
                    }`} />
                  </span>
                ))}
              </button>
            )}

            {/* Dark glass edge fade */}
            <div
              className="swipe-edge-glass swipe-edge-glass-top z-20"
              aria-hidden
            />

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
                  className="swipe-detail-glass-panel absolute inset-x-3 bottom-[calc(var(--safe-area-bottom)+4.5rem)] z-30 flex max-h-[58dvh] min-h-0 flex-col overflow-hidden rounded-2xl border shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
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
                    className="min-h-0 flex-1 overflow-y-auto no-scrollbar overscroll-contain"
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
            {!expanded && (
              <div
                ref={compactInfoRef}
                className="swipe-compact-info absolute bottom-0 inset-x-0 z-30 pointer-events-none"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="relative z-10 px-5 pb-[calc(var(--safe-area-bottom)+4.25rem)] pointer-events-none">
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
                    disabled={standby}
                    onClick={toggleExpand}
                    aria-label="Ver detalhes do item"
                    className="block w-full text-left pointer-events-auto active:scale-[0.99] transition-transform"
                  >
                    <div className="swipe-compact-heading-row flex min-w-0 flex-col gap-1.5 pb-2">
                      <h2 className="swipe-compact-title min-w-0 line-clamp-2 break-words text-[24px] font-bold tracking-tight leading-[1.12]">
                        {item.name}
                      </h2>
                      <span className="swipe-compact-price break-words text-[22px] font-semibold leading-tight tracking-tight">
                        {formatValue(item.market_value)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 mb-1.5">
                      <span className="swipe-compact-chip max-w-full break-words px-2 py-0.5 rounded-full text-[11px] font-medium uppercase">
                        {item.category}
                      </span>
                      {conditionLabel && (
                        <span className="swipe-compact-chip px-2 py-0.5 rounded-full text-[11px] font-medium uppercase flex items-center gap-1">
                          <Package className="h-2.5 w-2.5" /> {conditionLabel}
                        </span>
                      )}
                      {compactLocation && (
                        <span className="swipe-compact-chip max-w-full px-2 py-0.5 rounded-full text-[11px] font-medium uppercase flex items-center gap-1 min-w-0">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />{" "}
                          <span className="truncate">{compactLocation}</span>
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 text-[11px] font-medium text-white">
                      Ver detalhes <ChevronDown className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </button>

                  <div className="mt-3 h-14" aria-hidden />
                </div>
              </div>
            )}
          </div>
        </motion.div>
        {!standby && !expanded && (
          <div className="swipe-fixed-actions absolute inset-x-0 bottom-[calc(var(--safe-area-bottom)+4.25rem)] z-[70] pointer-events-none" onPointerDown={(event) => event.stopPropagation()}>
            <SwipeActionButtons
              x={x}
              disabled={disabled || mediaZoom.scale > 1.01}
              onDislike={() => doExit("dislike")}
              onLike={() => doExit("like")}
            />
          </div>
        )}
        </>
      );
    }
  )
);

SwipeCard.displayName = "SwipeCard";

export default SwipeCard;
