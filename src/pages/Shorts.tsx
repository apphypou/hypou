import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchShortsFeed, type SortMode, type ShortVideo } from "@/services/videoService";
import ShortCard from "@/components/ShortCard";
import SelectItemDialog from "@/components/SelectItemDialog";
import { Loader2, Clapperboard, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createProposal } from "@/services/matchService";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { categories as allCategories } from "@/constants/categories";

const CATEGORIES = [
  { label: "Todos", value: "" },
  ...allCategories.map((c) => ({ label: `${c.emoji} ${c.label}`, value: c.label })),
];

const Shorts = () => {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [sort, setSort] = useState<SortMode>("trending");
  const [category, setCategory] = useState("");
  const [direction, setDirection] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [pendingTradeVideo, setPendingTradeVideo] = useState<ShortVideo | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["shorts-feed", sort, category],
    queryFn: () => fetchShortsFeed(0, 20, sort, category || undefined, user?.id),
  });

  const goTo = useCallback((idx: number) => {
    if (isAnimating || idx < 0 || idx >= videos.length || idx === visibleIndex) return;
    setDirection(idx > visibleIndex ? 1 : -1);
    setIsAnimating(true);
    setVisibleIndex(idx);
  }, [isAnimating, videos.length, visibleIndex]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 60) return;
    if (dy > 0) goTo(visibleIndex + 1);
    else goTo(visibleIndex - 1);
  }, [touchStartY, visibleIndex, goTo]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (isAnimating || Math.abs(e.deltaY) < 30) return;
    if (e.deltaY > 0) goTo(visibleIndex + 1);
    else goTo(visibleIndex - 1);
  }, [isAnimating, visibleIndex, goTo]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchEnd]);

  const handleLikeUpdate = useCallback((videoId: string, liked: boolean, newCount: number) => {
    // Could update cache here
  }, []);

  // Trade flow
  const handleTradePress = useCallback((video: ShortVideo) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (video.user_id === user.id) {
      toast({ title: "Ops!", description: "Você não pode trocar com seu próprio item." });
      return;
    }
    setPendingTradeVideo(video);
    setTradeDialogOpen(true);
  }, [user, navigate]);

  const handleProposalConfirm = useCallback(async (myItemId: string) => {
    if (!user || !pendingTradeVideo?.item) return;
    setProposalLoading(true);
    try {
      await createProposal(
        user.id,
        myItemId,
        pendingTradeVideo.item.id,
        pendingTradeVideo.user_id
      );
      toast({
        title: "Proposta enviada! 🎉",
        description: `Sua proposta de troca por "${pendingTradeVideo.item.name}" foi enviada.`,
      });
      setTradeDialogOpen(false);
      setPendingTradeVideo(null);
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.message || "Não foi possível enviar a proposta.",
        variant: "destructive",
      });
    } finally {
      setProposalLoading(false);
    }
  }, [user, pendingTradeVideo]);

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
      {/* Header — simplified, no social tabs */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="bg-gradient-to-b from-black/60 via-black/30 to-transparent">
          <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,12px)+16px)] pb-2 pointer-events-auto">
            <button
              onClick={() => navigate(-1)}
              className="h-10 w-10 flex items-center justify-center rounded-full"
            >
              <ArrowLeft className="h-5 w-5 text-white drop-shadow-lg" />
            </button>

            <h1 className="text-white font-extrabold text-base drop-shadow-lg">
              Vitrine
            </h1>

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

      {/* Swipe hint */}
      <AnimatePresence>
        {visibleIndex === 0 && !isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="flex flex-col items-center gap-1"
            >
              <div className="h-8 w-[3px] rounded-full bg-white/40" />
              <span className="text-white/40 text-[10px] font-medium">Deslize para ver mais</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video feed */}
      <div ref={containerRef} className="h-full w-full relative">
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
              onTradePress={handleTradePress}
            />
          </motion.div>
        </AnimatePresence>

        {visibleIndex + 1 < videos.length && (
          <link rel="preload" as="video" href={videos[visibleIndex + 1].video_url} />
        )}
      </div>

      {/* Position dots */}
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

      {/* Trade dialog */}
      <SelectItemDialog
        open={tradeDialogOpen}
        onClose={() => { setTradeDialogOpen(false); setPendingTradeVideo(null); }}
        onConfirm={handleProposalConfirm}
        targetItemName={pendingTradeVideo?.item?.name}
        loading={proposalLoading}
      />
    </div>
  );
};

export default Shorts;
