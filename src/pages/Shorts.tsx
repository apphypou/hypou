import { useRef, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchShortsFeed } from "@/services/videoService";
import ShortCard from "@/components/ShortCard";
import { Loader2, Clapperboard } from "lucide-react";

const Shorts = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["shorts-feed"],
    queryFn: () => fetchShortsFeed(0, 20),
  });

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setVisibleIndex(idx);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-[100dvh] w-full bg-background flex flex-col items-center justify-center gap-4 px-8">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
          <Clapperboard className="h-10 w-10 text-foreground/20" />
        </div>
        <h2 className="text-foreground text-xl font-bold text-center">Nenhum short ainda</h2>
        <p className="text-foreground/50 text-sm text-center max-w-xs">
          Em breve, vídeos dos produtos vão aparecer aqui. Adicione vídeos aos seus itens no perfil!
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
    >
      {videos.map((video, idx) => (
        <ShortCard key={video.id} video={video} isVisible={idx === visibleIndex} />
      ))}
    </div>
  );
};

export default Shorts;
