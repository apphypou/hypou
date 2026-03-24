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
import { MapPin, Image, Package, ChevronUp, ChevronDown, Star, ChevronRight, Shield, Repeat, Play, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRating } from "@/hooks/useRatings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SWIPE_THRESHOLD = 80;
const EXIT_X = 500;

export interface SwipeCardHandle {
  triggerSwipe: (direction: "like" | "dislike") => void;
}

interface MatchedOwnItem {
  id: string;
  name: string;
  image_url: string | null;
}

interface SwipeCardProps {
  item: any;
  onSwipeComplete: (direction: "like" | "dislike") => void;
  onDragDirectionChange?: (rawX: number) => void;
  disabled?: boolean;
  standby?: boolean;
  matchedOwnItem?: MatchedOwnItem | null;
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

const getTimeSince = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  const created = new Date(dateStr);
  const now = new Date();
  const months = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (months < 1) return "Novo membro";
  if (months === 1) return "Há 1 mês";
  if (months < 12) return `Há ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? "Há 1 ano" : `Há ${years} anos`;
};

/* ── Expanded detail content inside card ── */
const CardDetailContent = ({ item }: { item: any }) => {
  const navigate = useNavigate();
  const ownerProfile = item?.profiles as any;
  const conditionLabel = translateCondition(item?.condition);
  const { data: rating } = useUserRating(ownerProfile?.user_id);

  // Fetch trade count for the owner
  const { data: tradeCount = 0 } = useQuery({
    queryKey: ["user-trade-count", ownerProfile?.user_id],
    queryFn: async () => {
      const uid = ownerProfile?.user_id;
      if (!uid) return 0;
      const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`);
      return count || 0;
    },
    enabled: !!ownerProfile?.user_id,
  });

  const memberSince = getTimeSince(ownerProfile?.created_at);

  return (
    <div className="space-y-4 px-4 pb-6 pt-2">
      {/* Price + tags */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
          {formatValue(item.market_value)}
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-white/20 border border-white/20 text-white text-[10px] font-bold tracking-[0.1em] uppercase">
          {item.category}
        </span>
        {conditionLabel && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-bold uppercase">
            <Package className="h-3 w-3" />
            {conditionLabel}
          </span>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-white/50" />
        <span className="text-white/70 text-sm">
          {item.location || ownerProfile?.location || "Local não informado"}
        </span>
      </div>

      {/* Description */}
      {item.description && (
        <div>
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
            Descrição
          </h3>
          <p className="text-white/80 text-sm leading-relaxed">
            {item.description}
          </p>
        </div>
      )}

      {/* Trade range — simplified */}
      {(item.margin_down > 0 || item.margin_up > 0) && (
        <div>
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
            Aceita trocar por
          </h3>
          <p className="text-white/70 text-sm">
            Itens de {formatValue(Math.round(item.market_value * (1 - (item.margin_down || 0) / 100)))} até {formatValue(Math.round(item.market_value * (1 + (item.margin_up || 0) / 100)))}
          </p>
        </div>
      )}

      {/* Owner profile with trust signals */}
      {ownerProfile && (
        <div>
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
            Anunciante
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/usuario/${ownerProfile.user_id}`);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
          >
            {ownerProfile.avatar_url ? (
              <img
                src={ownerProfile.avatar_url}
                alt=""
                className="h-11 w-11 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className="h-11 w-11 rounded-full bg-white/15 flex items-center justify-center border-2 border-white/20">
                <span className="text-base font-bold text-white/50">
                  {(ownerProfile.display_name || "?")[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-white font-bold text-sm">
                {ownerProfile.display_name || "Usuário"}
              </p>
              {/* Trust signals */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-semibold text-yellow-400">{rating.average}</span>
                    <span className="text-[10px] text-white/40">({rating.count})</span>
                  </div>
                )}
                {tradeCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Repeat className="h-3 w-3 text-white/40" />
                    <span className="text-[10px] text-white/50">{tradeCount} {tradeCount === 1 ? "troca" : "trocas"}</span>
                  </div>
                )}
                {memberSince && (
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-white/40" />
                    <span className="text-[10px] text-white/50">{memberSince}</span>
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
          </button>
        </div>
      )}
    </div>
  );
};

const SwipeCard = memo(forwardRef<SwipeCardHandle, SwipeCardProps>(
  ({ item, onSwipeComplete, onDragDirectionChange, disabled, standby, matchedOwnItem }, ref) => {
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
          animate(x, 0, { type: "spring", stiffness: 600, damping: 26, mass: 0.8 });
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
          zIndex: standby ? 9 : 10,
          willChange: standby ? "auto" : "transform",
          transformOrigin: "50% 80%",
          ...(standby ? { scale: 0.97, y: 0, opacity: 0 } : {}),
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
              src={currentImage}
              alt=""
              className="w-full h-full object-cover scale-105 blur-xl opacity-90 saturate-150"
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
        {!standby && !expanded && (
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
                FLOPOU
              </motion.span>
            </motion.div>
          </>
        )}

        {/* ===== FULL IMAGE / VIDEO ===== */}
        <div className="absolute inset-0 w-full h-full" onClick={standby ? undefined : handleImageTap}>
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
            <>
              <img
                key={`bg-${activeImageIndex}`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-80"
                src={currentImage}
                draggable={false}
              />
              <img
                key={activeImageIndex}
                alt={item.name}
                className="relative w-full h-full object-contain z-[1]"
                src={currentImage}
                draggable={false}
              />
            </>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Image className="h-16 w-16 text-foreground/10" />
            </div>
          )}
        </div>

        {/* Owner mini-profile — top left with trust badge */}
        {ownerProfile && !expanded && (
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
            {rating && (
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 text-[10px] font-bold">{rating.average}</span>
              </div>
            )}
          </div>
        )}


        {/* Slide dots + share — top right */}
        {!expanded && (
          <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
            {totalSlides > 1 && (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      i === activeImageIndex ? "w-5 bg-white" : "w-1.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const shareUrl = `https://hypou.lovable.app/explorar`;
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
              className="h-8 w-8 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 flex items-center justify-center"
            >
              <Share2 className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        )}

        {/* Top gradient for readability */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent pointer-events-none z-20" />

        {/* Bottom gradient */}
        <div className={`absolute inset-x-0 bottom-0 pointer-events-none z-20 transition-all duration-200 ${
          expanded ? "h-full bg-gradient-to-t from-black/80 via-black/60 to-black/40" : "h-64 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
        }`} />

        {/* ===== EXPANDED SCROLLABLE OVERLAY ===== */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-x-3 bottom-3 top-3 z-30 flex flex-col rounded-2xl bg-white/15 dark:bg-white/10 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              {/* Collapse button at top */}
              <button
                onClick={toggleExpand}
                className="w-full flex justify-center items-center gap-1 pt-4 pb-2 text-white/60 shrink-0"
              >
                <ChevronDown className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Recolher</span>
              </button>

              {/* Scrollable detail content */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto no-scrollbar overscroll-contain"
                onTouchMove={(e) => e.stopPropagation()}
              >
                {/* Item name header */}
                <div className="px-4 pb-2">
                  <h2 className="text-white text-xl font-bold tracking-tight drop-shadow-md">
                    {item.name}
                  </h2>
                </div>
                <CardDetailContent item={item} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== COMPACT INFO PANEL (collapsed) ===== */}
        {activeImageIndex === 0 && !expanded && (
        <div
          className="absolute bottom-0 inset-x-0 z-30 p-3 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand(e);
          }}
        >
          <div className="rounded-2xl bg-white/15 dark:bg-white/10 backdrop-blur-2xl border border-white/20 dark:border-white/10 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 border border-white/20 text-white text-[9px] font-bold tracking-[0.1em] uppercase">
                    {item.category}
                  </span>
                  {conditionLabel && (
                    <span className="text-white/60 text-[9px] font-bold uppercase flex items-center gap-0.5">
                      <Package className="h-2.5 w-2.5" /> {conditionLabel}
                    </span>
                  )}
                  {item.location && (
                    <span className="text-white/60 text-[9px] font-bold uppercase flex items-center gap-0.5 truncate max-w-[100px]">
                      <MapPin className="h-2.5 w-2.5 shrink-0" /> {item.location}
                    </span>
                  )}
                </div>
                <h2 className="text-white text-base font-bold tracking-tight leading-tight drop-shadow-md truncate">
                  {item.name}
                </h2>
                <span className="text-white text-lg font-extrabold tracking-tighter drop-shadow-md">
                  {formatValue(item.market_value)}
                </span>
                {matchedOwnItem && (
                  <div className="flex items-center gap-1.5 mt-1.5">
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
                    <span className="text-white/60 text-[10px] font-medium truncate max-w-[160px]">
                      Compatível com <span className="text-primary font-semibold">{matchedOwnItem.name}</span>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-0.5 text-white/50">
                <ChevronUp className="h-4 w-4 animate-bounce" />
                <span className="text-[8px] font-semibold uppercase tracking-wider">Detalhes</span>
              </div>
            </div>
          </div>
        </div>
        )}
        </div>{/* close inner card */}
      </motion.div>
    );
  }
));

SwipeCard.displayName = "SwipeCard";

export default SwipeCard;
