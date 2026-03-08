import { useRef, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchShortsFeed, type SortMode, type ShortVideo } from "@/services/videoService";
import ShortCard from "@/components/ShortCard";
import { Loader2, Clapperboard, Flame, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

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
];

const SORT_OPTIONS: { label: string; value: SortMode; icon: typeof Clock }[] = [
  { label: "Recentes", value: "recent", icon: Clock },
  { label: "Trending", value: "trending", icon: Flame },
  { label: "Popular", value: "popular", icon: TrendingUp },
];

const Shorts = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [sort, setSort] = useState<SortMode>("trending");
  const [category, setCategory] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const { user } = useAuth();
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>();
  const isScrolling = useRef(false);
  const touchStartY = useRef(0);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["shorts-feed", sort, category],
    queryFn: () => fetchShortsFeed(0, 20, sort, category || undefined, user?.id),
  });

  const scrollToIndex = useCallback((idx: number) => {
    const el = containerRef.current;
    if (!el || idx < 0 || idx >= videos.length) return;
    isScrolling.current = true;
    setVisibleIndex(idx);
    el.scrollTo({ top: idx * el.clientHeight, behavior: "smooth" });
    setTimeout(() => { isScrolling.current = false; }, 500);
  }, [videos.length]);

  // Touch-based single-page scroll
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    const threshold = 50;
    if (Math.abs(dy) < threshold) return;
    if (dy > 0) {
      scrollToIndex(visibleIndex + 1); // swipe up → next
    } else {
      scrollToIndex(visibleIndex - 1); // swipe down → prev
    }
  }, [visibleIndex, scrollToIndex]);

  // Prevent free scroll with wheel (desktop)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (isScrolling.current) return;
    if (Math.abs(e.deltaY) < 30) return;
    if (e.deltaY > 0) {
      scrollToIndex(visibleIndex + 1);
    } else {
      scrollToIndex(visibleIndex - 1);
    }
  }, [visibleIndex, scrollToIndex]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Show filters briefly on index change
  useEffect(() => {
    setShowFilters(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setShowFilters(false), 3000);
  }, [visibleIndex]);

  // Auto-hide filters on mount
  useEffect(() => {
    hideTimeout.current = setTimeout(() => setShowFilters(false), 4000);
    return () => { if (hideTimeout.current) clearTimeout(hideTimeout.current); };
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

  return (
    <div className="relative h-[100dvh] w-full bg-black">
      {/* Top filters overlay */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 z-30 pointer-events-none"
            onMouseEnter={() => setShowFilters(true)}
          >
            <div className="bg-gradient-to-b from-black/70 via-black/40 to-transparent pt-12 pb-6 px-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sort tabs */}
              <div className="flex items-center justify-center gap-1 mb-3">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                      sort === opt.value
                        ? "bg-white text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Category pills */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                      category === cat.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap zone to show filters */}
      <div
        className="absolute top-0 left-0 right-0 h-16 z-20"
        onClick={(e) => {
          e.stopPropagation();
          setShowFilters(true);
          if (hideTimeout.current) clearTimeout(hideTimeout.current);
          hideTimeout.current = setTimeout(() => setShowFilters(false), 4000);
        }}
      />

      {/* Video feed */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden no-scrollbar"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {videos.map((video, idx) => (
          <ShortCard key={video.id} video={video} isVisible={idx === visibleIndex} />
        ))}
      </div>
    </div>
  );
};

export default Shorts;
