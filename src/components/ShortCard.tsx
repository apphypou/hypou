import { useRef, useEffect, useState, useCallback } from "react";
import { Heart, Eye, ArrowLeftRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { toggleLike, incrementView, type ShortVideo } from "@/services/videoService";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { formatValue } from "@/lib/utils";

interface ShortCardProps {
  video: ShortVideo;
  isVisible: boolean;
  onLikeUpdate?: (videoId: string, liked: boolean, newCount: number) => void;
  onTradePress?: (video: ShortVideo) => void;
}

const ShortCard = ({ video, isVisible, onLikeUpdate, onTradePress }: ShortCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [liked, setLiked] = useState(video.liked_by_me ?? false);
  const [likeCount, setLikeCount] = useState(video.like_count);
  const [viewCounted, setViewCounted] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const lastTap = useRef(0);

  useEffect(() => {
    setLiked(video.liked_by_me ?? false);
    setLikeCount(video.like_count);
    setProgress(0);
    setViewCounted(false);
  }, [video.id]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isVisible) {
      el.play().then(() => setPlaying(true)).catch(() => {});
      if (!viewCounted && !video.isMock) {
        const timer = setTimeout(() => {
          incrementView(video.id).catch(() => {});
          setViewCounted(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      el.pause();
      el.currentTime = 0;
      setPlaying(false);
    }
  }, [isVisible, viewCounted, video.id, video.isMock]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onTime = () => {
      if (el.duration) setProgress((el.currentTime / el.duration) * 100);
    };
    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, []);

  const togglePlay = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleLike();
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;

    setTimeout(() => {
      if (Date.now() - lastTap.current >= 280) {
        const el = videoRef.current;
        if (!el) return;
        if (el.paused) {
          el.play().then(() => setPlaying(true)).catch(() => {});
        } else {
          el.pause();
          setPlaying(false);
        }
        setShowControls(true);
        setTimeout(() => setShowControls(false), 1200);
      }
    }, 300);
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted((m) => !m);
  };

  const handleLike = async () => {
    if (video.isMock) {
      setLiked((l) => !l);
      setLikeCount((c) => liked ? c - 1 : c + 1);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
      return;
    }
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => newLiked ? c + 1 : c - 1);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    try {
      await toggleLike(video.id);
      onLikeUpdate?.(video.id, newLiked, newLiked ? likeCount + 1 : likeCount - 1);
    } catch {
      setLiked(!newLiked);
      setLikeCount((c) => newLiked ? c - 1 : c + 1);
    }
  };

  const formatValue = (cents: number) =>
    `R$ ${(cents / 100).toLocaleString("pt-BR")}`;

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div
      className="relative h-[100dvh] w-full bg-black flex items-center justify-center"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={video.video_url}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted={muted}
        playsInline
        preload="metadata"
        poster={video.thumbnail_url || undefined}
      />

      {/* Double-tap heart */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <Heart className="h-28 w-28 text-red-500 fill-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause indicator */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          >
            <div className="h-18 w-18 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
              {playing ? (
                <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="h-10 w-10 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,4 20,12 6,20" />
                </svg>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className="absolute top-16 left-4 z-20 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
      >
        {muted ? (
          <svg className="h-3.5 w-3.5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" fill="currentColor" opacity="0.3" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" fill="currentColor" opacity="0.3" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      {/* Right sidebar — only like + views */}
      <div className="absolute right-3 bottom-52 z-20 flex flex-col items-center gap-5">
        {/* Profile avatar */}
        {video.profile && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!video.isMock) navigate(`/usuario/${video.user_id}`);
            }}
          >
            <div className="p-[2px] rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/40">
              <Avatar className="h-11 w-11 border-2 border-black">
                <AvatarImage src={video.profile.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-foreground text-sm font-bold">
                  {(video.profile.display_name || "U")[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </button>
        )}

        {/* Like */}
        <button
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          className="flex flex-col items-center gap-1"
        >
          <motion.div
            animate={liked ? { scale: [1, 1.3, 1] } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
              liked ? "bg-red-500/20" : "bg-black/30 backdrop-blur-sm"
            }`}
          >
            <Heart className={`h-6 w-6 transition-all ${
              liked ? "text-red-500 fill-red-500" : "text-white"
            }`} />
          </motion.div>
          <span className="text-white text-[11px] font-bold drop-shadow-lg">{formatCount(likeCount)}</span>
        </button>

        {/* Views */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-9 w-9 rounded-full bg-black/20 flex items-center justify-center">
            <Eye className="h-5 w-5 text-white/60" />
          </div>
          <span className="text-white/60 text-[10px] font-bold">{formatCount(video.view_count)}</span>
        </div>
      </div>

      {/* Bottom overlay — item info + trade CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-6 px-4">
          <div className="pointer-events-auto pr-16">
            {/* Username */}
            {video.profile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!video.isMock) navigate(`/usuario/${video.user_id}`);
                }}
                className="mb-2 flex items-center gap-1.5"
              >
                <span className="text-white font-extrabold text-sm drop-shadow-lg">
                  @{video.profile.display_name || "Usuário"}
                </span>
              </button>
            )}

            {/* Item info */}
            {video.item && (
              <div className="mb-3 space-y-1.5">
                <span className="inline-block px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-wider">
                  {video.item.category}
                </span>

                <div>
                  <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                    {video.item.name}
                  </h3>
                  {video.item.market_value > 0 && (
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-bold">
                      {formatValue(video.item.market_value)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* CTA — "Quero Trocar" opens trade flow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTradePress?.(video);
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-[0_4px_20px_hsl(var(--primary)/0.4)]"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Quero Trocar
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] bg-white/10">
        <div
          className="h-full bg-primary transition-[width] duration-200 ease-linear rounded-r-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ShortCard;
