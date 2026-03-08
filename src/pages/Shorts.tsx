import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchShortsFeed, type SortMode, type ShortVideo } from "@/services/videoService";
import ShortCard from "@/components/ShortCard";
import { Loader2, Clapperboard, Search, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const CATEGORIES = [
  { label: "Todos", value: "" },
  { label: "📱 Celulares", value: "Celulares" },
  { label: "🎮 Videogames", value: "Videogames" },
  { label: "💻 Eletrônicos", value: "Eletrônicos" },
  { label: "👟 Moda", value: "Moda" },
  { label: "🏠 Casa", value: "Casa" },
  { label: "🎸 Instrumentos", value: "Instrumentos" },
  { label: "⚽ Esportes", value: "Esportes" },
  { label: "📚 Livros", value: "Livros" },
  { label: "🔧 Ferramentas", value: "Ferramentas" },
];

type FeedTab = "para_voce" | "seguindo";

const Shorts = () => {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [sort, setSort] = useState<SortMode>("trending");
  const [category, setCategory] = useState("");
  const [direction, setDirection] = useState(0); // 1 = down, -1 = up
  const [isAnimating, setIsAnimating] = useState(false);
  const [feedTab, setFeedTab] = useState<FeedTab>("para_voce");
  const [touchStartY, setTouchStartY] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["shorts-feed", sort, category],
    queryFn: () => fetchShortsFeed(0, 20, sort, category || undefined, user?.id),
  });

  // Virtualize: only render prev, current, next
  const visibleVideos = useMemo(() => {
    const result: { video: ShortVideo; idx: number }[] = [];
    for (let i = visibleIndex - 1; i <= visibleIndex + 1; i++) {
      if (i >= 0 && i < videos.length) {
        result.push({ video: videos[i], idx: i });
      }
    }
    return result;
  }, [videos, visibleIndex]);

  const goTo = useCallback((idx: number) => {
    if (isAnimating || idx < 0 || idx >= videos.length || idx === visibleIndex) return;
    setDirection(idx > visibleIndex ? 1 : -1);
    setIsAnimating(true);
    setVisibleIndex(idx);
  }, [isAnimating, videos.length, visibleIndex]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 60) return;
    if (dy > 0) goTo(visibleIndex + 1);
    else goTo(visibleIndex - 1);
  }, [touchStartY, visibleIndex, goTo]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (isAnimating || Math.abs(e.deltaY) < 30) return;
    if (e.deltaY > 0) goTo(visibleIndex + 1);
    else goTo(visibleIndex - 1);
  }, [isAnimating, visibleIndex, goTo]);

  const handleLikeUpdate = useCallback((videoId: string, liked: boolean, newCount: number) => {
    // Could update cache here
  }, []);

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
        <h2 className="text-foreground text-xl font-bold text-center">Nenhum short encontrado</h2>
        <p className="text-foreground/50 text-sm text-center max-w-xs">
          Tente mudar o filtro ou a categoria.
        </p>
      </div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? "100%" : "-100%",
      opacity: 0.5,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      y: dir > 0 ? "-100%" : "100%",
      opacity: 0.5,
    }),
  };

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden">
      {/* Fixed Header */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="bg-gradient-to-b from-black/60 via-black/30 to-transparent">
          <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-2 pointer-events-auto">
            {/* Back button */}
            <button
              onClick={() => navigate("/explorar")}
              className="h-10 w-10 flex items-center justify-center rounded-full"
            >
              <ArrowLeft className="h-5 w-5 text-white drop-shadow-lg" />
            </button>

            {/* Feed tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFeedTab("para_voce")}
                className="relative px-4 py-2"
              >
                <span className={`text-sm font-bold transition-all ${
                  feedTab === "para_voce" ? "text-white" : "text-white/50"
                }`}>
                  Para Você
                </span>
                {feedTab === "para_voce" && (
                  <motion.div
                    layoutId="feed-tab-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full bg-white"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => setFeedTab("seguindo")}
                className="relative px-4 py-2"
              >
                <span className={`text-sm font-bold transition-all ${
                  feedTab === "seguindo" ? "text-white" : "text-white/50"
                }`}>
                  Seguindo
                </span>
                {feedTab === "seguindo" && (
                  <motion.div
                    layoutId="feed-tab-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full bg-white"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="h-10 w-10 flex items-center justify-center rounded-full relative">
                    <SlidersHorizontal className="h-5 w-5 text-white drop-shadow-lg" />
                    {category && (
                      <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-black" />
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-background/95 backdrop-blur-xl border-foreground/10 rounded-t-3xl">
                  <SheetHeader>
                    <SheetTitle className="text-foreground">Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-4 pb-8">
                    {/* Sort */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Ordenar por</p>
                      <div className="flex gap-2">
                        {(["trending", "recent", "popular"] as SortMode[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => setSort(s)}
                            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
                              sort === s
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {s === "trending" ? "🔥 Trending" : s === "recent" ? "🕐 Recentes" : "📈 Popular"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Categories */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Categoria</p>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.value}
                            onClick={() => setCategory(cat.value)}
                            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                              category === cat.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Swipe hint on first video */}
      <AnimatePresence>
        {visibleIndex === 0 && !isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="flex flex-col items-center gap-1"
            >
              <div className="h-8 w-[3px] rounded-full bg-white/40" />
              <span className="text-white/40 text-[10px] font-medium">Deslize para cima</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video feed with AnimatePresence */}
      <div
        className="h-full w-full relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout" onExitComplete={() => setIsAnimating(false)}>
          <motion.div
            key={visibleIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              y: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <ShortCard
              video={videos[visibleIndex]}
              isVisible={true}
              onLikeUpdate={handleLikeUpdate}
            />
          </motion.div>
        </AnimatePresence>

        {/* Preload next video */}
        {visibleIndex + 1 < videos.length && (
          <link
            rel="preload"
            as="video"
            href={videos[visibleIndex + 1].video_url}
          />
        )}
      </div>

      {/* Position indicator dots */}
      {videos.length > 1 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1 pointer-events-none">
          {videos.map((_, idx) => {
            const dist = Math.abs(idx - visibleIndex);
            if (dist > 3) return null;
            return (
              <div
                key={idx}
                className={`rounded-full transition-all duration-300 ${
                  idx === visibleIndex
                    ? "h-4 w-1.5 bg-white"
                    : dist === 1
                    ? "h-2 w-1.5 bg-white/40"
                    : "h-1.5 w-1.5 bg-white/20"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Shorts;
