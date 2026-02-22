import { X, Zap, Heart, MapPin, SlidersHorizontal, Image, Loader2 } from "lucide-react";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import IconButton from "@/components/IconButton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getExploreItems } from "@/services/itemService";
import { createSwipe } from "@/services/swipeService";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Explorar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["explore-items", user?.id],
    queryFn: () => getExploreItems(user!.id),
    enabled: !!user,
  });

  const currentItem = items[currentIndex];

  const handleSwipe = async (direction: "like" | "dislike" | "superlike") => {
    if (!user || !currentItem || swiping) return;
    setSwiping(true);
    try {
      await createSwipe(user.id, currentItem.id, direction);
      if (currentIndex + 1 >= items.length) {
        // Refetch when we run out
        queryClient.invalidateQueries({ queryKey: ["explore-items"] });
        setCurrentIndex(0);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    } catch (err: any) {
      toast({ title: "Erro ao registrar swipe", description: err.message, variant: "destructive" });
    } finally {
      setSwiping(false);
    }
  };

  const formatValue = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  };

  const mainImage = currentItem?.item_images?.[0]?.image_url;
  const imageCount = currentItem?.item_images?.length || 0;
  const ownerProfile = currentItem?.profiles as any;

  return (
    <ScreenLayout>
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-12 pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-0.5">
            Encontre Trocas
          </span>
          <h1 className="text-foreground text-xl font-extrabold tracking-tight">
            Explorar <span className="text-primary">Trocas</span>
          </h1>
        </div>
        <IconButton icon={SlidersHorizontal} />
      </header>

      {/* Main Card Area */}
      <main className="relative flex-1 flex flex-col items-center justify-start w-full px-5 pb-8 pt-2 z-10">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        ) : !currentItem ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <span className="text-6xl mb-4">🔍</span>
            <h2 className="text-xl font-bold text-foreground mb-2">Sem itens por agora</h2>
            <p className="text-muted-foreground text-sm">Volte mais tarde para encontrar novas trocas!</p>
          </div>
        ) : (
          <div className="relative w-full h-full max-h-[580px] flex flex-col">
            {/* Background stack card */}
            <div className="absolute inset-0 z-0 bg-muted rounded-[2.5rem] border border-foreground/5" style={{ transform: "scale(0.93) translateY(-15px)", opacity: 0.4 }} />

            {/* Main card */}
            <div className="relative z-10 flex-1 w-full bg-muted rounded-[2.5rem] overflow-hidden border border-foreground/10 flex flex-col swipe-card">
              {/* Image */}
              <div className="absolute inset-0">
                {mainImage ? (
                  <img alt={currentItem.name} className="w-full h-full object-cover" src={mainImage} />
                ) : (
                  <div className="w-full h-full bg-card flex items-center justify-center">
                    <Image className="h-16 w-16 text-foreground/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
              </div>

              {/* Card Content */}
              <div className="relative mt-auto w-full p-7 pb-28 space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-foreground/10 backdrop-blur-md border border-foreground/10 text-foreground/90 text-[10px] font-bold tracking-[0.1em] uppercase">
                      {currentItem.category}
                    </span>
                    {imageCount > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-foreground/5 text-foreground/80">
                        <Image className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-semibold">{imageCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-foreground text-3xl font-bold tracking-tight">{currentItem.name}</h2>
                    <div className="flex items-center gap-1.5 text-foreground/60">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {currentItem.location || ownerProfile?.location || "Localização não informada"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-foreground/40 text-[11px] font-bold uppercase tracking-widest">
                    Valor de mercado
                  </span>
                  <span className="text-primary text-3xl font-extrabold tracking-tighter text-glow uppercase">
                    {formatValue(currentItem.market_value)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center items-center gap-6 px-4">
                <button
                  onClick={() => handleSwipe("dislike")}
                  disabled={swiping}
                  className="flex items-center justify-center h-16 w-16 rounded-full bg-muted/80 border border-foreground/10 text-foreground/50 backdrop-blur-xl transition-all active:scale-90 hover:bg-foreground/5 disabled:opacity-50"
                >
                  <X className="h-8 w-8" />
                </button>
                <button
                  onClick={() => handleSwipe("superlike")}
                  disabled={swiping}
                  className="flex items-center justify-center h-14 w-14 rounded-full bg-background border border-primary/40 text-primary neon-glow backdrop-blur-xl transition-all active:scale-90 -translate-y-2 disabled:opacity-50"
                >
                  <Zap className="h-7 w-7" />
                </button>
                <button
                  onClick={() => handleSwipe("like")}
                  disabled={swiping}
                  className="flex items-center justify-center h-16 w-16 rounded-full bg-primary border border-primary/20 text-background shadow-xl transition-all active:scale-90 disabled:opacity-50"
                >
                  <Heart className="h-8 w-8" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav activeTab="explorar" />
    </ScreenLayout>
  );
};

export default Explorar;
