import { Filter } from "lucide-react";
import { SkeletonSwipeCard } from "@/components/SkeletonCard";
import NotificationBell from "@/components/NotificationBell";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getExploreItems } from "@/services/itemService";
import { createSwipe } from "@/services/swipeService";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  AnimatePresence } from
"framer-motion";
import SwipeCard, { type SwipeCardHandle } from "@/components/SwipeCard";
import SwipeToggle from "@/components/SwipeToggle";
import { supabase } from "@/integrations/supabase/client";

const allCategories = [
{ emoji: "📱", label: "Celulares" },
{ emoji: "🚗", label: "Carros & Motos" },
{ emoji: "👕", label: "Moda" },
{ emoji: "🛋️", label: "Casa" },
{ emoji: "🎮", label: "Videogames" }];


const formatValue = (cents: number) =>
new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const Explorar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const swipingRef = useRef(false);
  const cardRef = useRef<SwipeCardHandle>(null);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);

  const [likeStreak, setLikeStreak] = useState(0);
  const [showStreak, setShowStreak] = useState(false);

  // Category filter state
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch user's preferred categories
  const { data: userCategories = [] } = useQuery({
    queryKey: ["user-categories", user?.id],
    queryFn: async () => {
      const { data } = await supabase.
      from("user_categories").
      select("category").
      eq("user_id", user!.id);
      return (data || []).map((c) => c.category);
    },
    enabled: !!user
  });

  const dragDirectionValue = useMotionValue(0);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["explore-items", user?.id],
    queryFn: () => getExploreItems(user!.id),
    enabled: !!user,
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (items.length > 0 && localItems.length === 0) {
      setLocalItems(items);
    }
  }, [items, localItems.length]);

  // Filter items by active category
  const filteredItems = useMemo(() => {
    if (!activeFilter) return localItems;
    return localItems.filter((item) => item.category === activeFilter);
  }, [localItems, activeFilter]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setEpoch((e) => e + 1);
    dragDirectionValue.set(0);
  }, [activeFilter, dragDirectionValue]);

  const currentItem = filteredItems[currentIndex];
  const nextItem = filteredItems[currentIndex + 1] ?? (filteredItems.length > 1 ? filteredItems[0] : null);

  const advanceCard = useCallback(() => {
    setPrevIndex(currentIndex);
    setEpoch((e) => e + 1);
    dragDirectionValue.set(0);
    if (currentIndex + 1 >= filteredItems.length) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, filteredItems.length, dragDirectionValue]);

  const handleUndo = useCallback(() => {
    if (prevIndex === null) return;
    setCurrentIndex(prevIndex);
    setPrevIndex(null);
    setEpoch((e) => e + 1);
    dragDirectionValue.set(0);
  }, [prevIndex, dragDirectionValue]);

  const triggerStreak = useCallback((direction: string) => {
    if (direction === "like") {
      setLikeStreak((s) => {
        const next = s + 1;
        if (next >= 3) {
          setShowStreak(true);
          setTimeout(() => setShowStreak(false), 1500);
        }
        return next;
      });
    } else {
      setLikeStreak(0);
      setShowStreak(false);
    }
  }, []);

  // Fire-and-forget background API call
  const recordSwipeInBackground = useCallback(
    (direction: "like" | "dislike", itemId: string) => {
      if (!user) return;
      (async () => {
        try {
          await createSwipe(user.id, itemId, direction);
          if (direction === "like") {
            const { supabase } = await import("@/integrations/supabase/client");
            const { data: newMatches } = await supabase.
            from("matches").
            select("id, created_at").
            or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`).
            order("created_at", { ascending: false }).
            limit(1);
            if (newMatches && newMatches.length > 0) {
              const matchAge = Date.now() - new Date(newMatches[0].created_at).getTime();
              if (matchAge < 5000) {
                navigate(`/match/${newMatches[0].id}`);
              }
            }
          }
        } catch (err: any) {
          if (!err.message?.includes("duplicate")) {
            toast({ title: "Erro ao registrar swipe", description: err.message, variant: "destructive" });
          }
        }
      })();
    },
    [user, navigate, toast]
  );

  const handleSwipeComplete = useCallback(
    (direction: "like" | "dislike") => {
      if (swipingRef.current || !user || !currentItem) return;
      swipingRef.current = true;

      triggerStreak(direction);
      const itemId = currentItem.id;

      // Haptic feedback on like
      if (direction === "like" && navigator.vibrate) {
        navigator.vibrate(50);
      }

      advanceCard();
      recordSwipeInBackground(direction, itemId);

      swipingRef.current = false;
    },
    [user, currentItem, advanceCard, triggerStreak, recordSwipeInBackground]
  );

  const handleDragDirectionChange = useCallback(
    (rawX: number) => {
      dragDirectionValue.set(rawX);
    },
    [dragDirectionValue]
  );

  // Preload image after next (next is already rendered in DOM)
  const afterNextItem = filteredItems[currentIndex + 2] ?? filteredItems[0] ?? null;
  const afterNextImage = afterNextItem?.item_images?.[0]?.image_url;

  useEffect(() => {
    if (afterNextImage) {
      const img = new window.Image();
      img.src = afterNextImage;
    }
  }, [afterNextImage]);

  const progressText = filteredItems.length > 0 ?
  `${Math.min(currentIndex + 1, filteredItems.length)}/${filteredItems.length}` :
  "";

  return (
    <ScreenLayout>
      {/* Compact header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-6 pb-2 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-0.5">
            Descubra
          </span>
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
            Explorar
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
            showFilters || activeFilter ? "bg-primary text-primary-foreground" : "bg-card border border-foreground/10 text-foreground/50"}`
            }>
            
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Category filter chips */}
      <AnimatePresence>
        {showFilters &&
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden px-6 shrink-0 z-30">
          
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
              <button
              onClick={() => setActiveFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              !activeFilter ?
              "bg-primary text-primary-foreground" :
              "bg-card border border-foreground/10 text-foreground/50"}`
              }>
              
                Todos
              </button>
              {allCategories.map((cat) => {
              const isUserPref = userCategories.includes(cat.label);
              return (
                <button
                  key={cat.label}
                  onClick={() => setActiveFilter(activeFilter === cat.label ? null : cat.label)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === cat.label ?
                  "bg-primary text-primary-foreground" :
                  isUserPref ?
                  "bg-primary/10 border border-primary/30 text-primary" :
                  "bg-card border border-foreground/10 text-foreground/50"}`
                  }>
                  
                    {cat.emoji} {cat.label}
                  </button>);

            })}
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Main Card Area */}
      <main className="relative flex-1 flex flex-col items-center justify-start w-full px-4 pb-36 pt-1 z-10">
        {isLoading ?
        <div className="flex-1 flex items-center justify-center w-full">
            <SkeletonSwipeCard />
          </div> :
        filteredItems.length === 0 ?
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <span className="text-6xl mb-4">🔍</span>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {activeFilter ? `Sem itens em "${activeFilter}"` : "Sem itens por agora"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {activeFilter ? "Tente outra categoria ou remova o filtro." : "Volte mais tarde para encontrar novas trocas!"}
            </p>
            {activeFilter &&
          <button
            onClick={() => setActiveFilter(null)}
            className="mt-4 text-primary text-xs font-bold uppercase tracking-wider">
            
                Limpar filtro
              </button>
          }
          </div> :
        currentItem ?
        <div className="relative w-full h-full">
            {/* Streak indicator */}
            <AnimatePresence>
              {showStreak && likeStreak >= 3 &&
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute -top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-xl">
              
                  <span className="text-lg">🔥</span>
                  <span className="text-primary text-sm font-bold">{likeStreak} curtidas seguidas!</span>
                </motion.div>
            }
            </AnimatePresence>

            {/* Next card — pre-rendered behind, ready to appear instantly */}
            {nextItem && nextItem.id !== currentItem.id &&
          <SwipeCard
            key={`standby-${nextItem.id}`}
            item={nextItem}
            onSwipeComplete={() => {}}
            standby />

          }

            {/* Active draggable card */}
            <SwipeCard
            key={`active-${currentItem.id}-${epoch}`}
            ref={cardRef}
            item={currentItem}
            onSwipeComplete={handleSwipeComplete}
            onDragDirectionChange={handleDragDirectionChange}
            disabled={swipingRef.current} />
          
          </div> :
        null}
      </main>

      {/* Toggle Switch */}
      {currentItem && !isLoading && filteredItems.length > 0 &&
      <div
        className="fixed left-0 right-0 z-40 flex justify-center items-center py-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)" }}>
        
          <SwipeToggle
          onSwipe={handleSwipeComplete}
          dragProgress={dragDirectionValue}
          disabled={swipingRef.current} />
        
        </div>
      }

      <BottomNav activeTab="explorar" />
    </ScreenLayout>);

};

export default Explorar;