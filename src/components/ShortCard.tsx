import { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface ShortCardProps {
  video: {
    id: string;
    video_url: string;
    item_id: string;
    user_id: string;
    item?: {
      name: string;
      market_value: number;
      category: string;
    } | null;
    profile?: {
      user_id: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  isVisible: boolean;
}

const ShortCard = ({ video, isVisible }: ShortCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isVisible) {
      el.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      el.pause();
      el.currentTime = 0;
      setPlaying(false);
    }
  }, [isVisible]);

  const togglePlay = () => {
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
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted((m) => !m);
  };

  const formatValue = (cents: number) =>
    `R$ ${(cents / 100).toLocaleString("pt-BR")}`;

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
      />

      {/* Play/Pause indicator */}
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="h-16 w-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-200">
            {playing ? (
              <Pause className="h-8 w-8 text-white" />
            ) : (
              <Play className="h-8 w-8 text-white ml-1" />
            )}
          </div>
        </div>
      )}

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

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20 pb-28 px-5">
          <div className="pointer-events-auto">
            {/* Profile */}
            {video.profile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/usuario/${video.user_id}`);
                }}
                className="flex items-center gap-2.5 mb-3"
              >
                <Avatar className="h-9 w-9 border-2 border-white/30">
                  <AvatarImage src={video.profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-white/20 text-white text-xs">
                    {(video.profile.display_name || "U")[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white font-bold text-sm drop-shadow-lg">
                  {video.profile.display_name || "Usuário"}
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
