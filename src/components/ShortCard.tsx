import { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Heart, Eye, Share2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { toggleLike, incrementView, type ShortVideo } from "@/services/videoService";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface ShortCardProps {
  video: ShortVideo;
  isVisible: boolean;
  onLikeUpdate?: (videoId: string, liked: boolean, newCount: number) => void;
}

const ShortCard = ({ video, isVisible, onLikeUpdate }: ShortCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [liked, setLiked] = useState(video.liked_by_me ?? false);
  const [likeCount, setLikeCount] = useState(video.like_count);
  const [viewCounted, setViewCounted] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const lastTap = useRef(0);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isVisible) {
      el.play().then(() => setPlaying(true)).catch(() => {});
      // Count view after 2s
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

  const togglePlay = useCallback(() => {
    const now = Date.now();
    // Double-tap to like
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
        setTimeout(() => setShowControls(false), 1500);
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.item?.name || "Short",
          url: window.location.href,
        });
      } catch {}
    }
  };

  return (
    <div
      className="relative h-[100dvh] w-full snap-start bg-black flex items-center justify-center"
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

      {/* Double-tap heart animation */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <Heart className="h-24 w-24 text-red-500 fill-red-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause indicator */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          >
            <div className="h-16 w-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              {playing ? (
                <Pause className="h-8 w-8 text-white" />
              ) : (
                <Play className="h-8 w-8 text-white ml-1" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="absolute top-14 right-4 z-20 h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
      >
        {muted ? (
          <VolumeX className="h-5 w-5 text-white" />
        ) : (
          <Volume2 className="h-5 w-5 text-white" />
        )}
      </button>

      {/* Right sidebar actions */}
      <div className="absolute right-3 bottom-44 z-20 flex flex-col items-center gap-5">
        {/* Like */}
        <button
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          className="flex flex-col items-center gap-1"
        >
          <div className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${
            liked ? "bg-red-500/20" : "bg-black/40 backdrop-blur-sm"
          }`}>
            <Heart className={`h-6 w-6 transition-all ${
              liked ? "text-red-500 fill-red-500 scale-110" : "text-white"
            }`} />
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(likeCount)}</span>
        </button>

        {/* Views */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-11 w-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow">{formatCount(video.view_count)}</span>
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1"
        >
          <div className="h-11 w-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow">Enviar</span>
        </button>

        {/* Profile avatar */}
        {video.profile && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!video.isMock) navigate(`/usuario/${video.user_id}`);
            }}
          >
            <Avatar className="h-11 w-11 border-2 border-white/50">
              <AvatarImage src={video.profile.avatar_url || undefined} />
              <AvatarFallback className="bg-white/20 text-white text-xs font-bold">
                {(video.profile.display_name || "U")[0]}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20 pb-28 px-5">
          <div className="pointer-events-auto pr-16">
            {/* Profile name */}
            {video.profile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!video.isMock) navigate(`/usuario/${video.user_id}`);
                }}
                className="mb-2"
              >
                <span className="text-white font-bold text-sm drop-shadow-lg">
                  @{video.profile.display_name || "Usuário"}
                </span>
              </button>
            )}

            {/* Item info */}
            {video.item && (
              <div className="mb-3">
                <span className="text-primary text-[10px] font-bold uppercase tracking-wider drop-shadow">
                  {video.item.category}
                </span>
                <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                  {video.item.name}
                </h3>
                <span className="text-white/70 text-sm font-medium">
                  {formatValue(video.item.market_value)}
                </span>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/explorar`);
              }}
              className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform"
            >
              Quero trocar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortCard;
