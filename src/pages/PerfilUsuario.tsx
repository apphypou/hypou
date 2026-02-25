import { ArrowLeft, MapPin } from "lucide-react";
import { SkeletonProfile, SkeletonItemCard } from "@/components/SkeletonCard";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ScreenLayout from "@/components/ScreenLayout";
import GlassCard from "@/components/GlassCard";

const formatValue = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const PerfilUsuario = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, bio, location")
        .eq("user_id", userId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ["user-items", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("id, name, market_value, category, location, item_images (image_url, position)")
        .eq("user_id", userId!)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const isLoading = loadingProfile || loadingItems;

  return (
    <ScreenLayout>
      {/* Header */}
      <header className="relative z-40 flex items-center gap-3 px-6 pt-12 pb-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-foreground text-lg font-bold tracking-tight">Perfil</h1>
      </header>

      <main className="relative flex-1 w-full px-5 overflow-y-auto no-scrollbar z-10 pb-28">
        {isLoading ? (
          <div className="flex flex-col gap-6 py-4 items-center">
            <SkeletonProfile />
            <div className="w-full space-y-3 mt-6">
              <SkeletonItemCard />
              <SkeletonItemCard />
            </div>
          </div>
        ) : !profile ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">🤷</span>
            <h2 className="text-xl font-bold text-foreground mb-2">Usuário não encontrado</h2>
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="flex flex-col items-center text-center mb-8 mt-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || ""}
                  className="h-24 w-24 rounded-full object-cover border-2 border-primary/30 mb-4"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-foreground/30">
                    {(profile.display_name || "?")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                {profile.display_name || "Usuário"}
              </h2>
              {profile.location && (
                <div className="flex items-center gap-1 mt-1 text-foreground/50">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs">{profile.location}</span>
                </div>
              )}
              {profile.bio && (
                <p className="text-sm text-foreground/60 mt-3 max-w-xs leading-relaxed">{profile.bio}</p>
              )}
            </div>

            {/* Items Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground/90 uppercase tracking-widest">
                  Anúncios Ativos
                </h3>
                <span className="text-primary text-xs font-semibold">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl mb-3">📦</span>
                  <p className="text-muted-foreground text-sm">Nenhum item ativo no momento</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {items.map((item) => {
                    const image = item.item_images?.[0]?.image_url;
                    return (
                      <GlassCard key={item.id} className="overflow-hidden">
                        <div className="relative aspect-square w-full">
                          {image ? (
                            <img src={image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-card flex items-center justify-center">
                              <span className="text-3xl">📦</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                        </div>
                        <div className="p-3">
                          <p className="text-foreground font-bold text-sm truncate">{item.name}</p>
                          <p className="text-primary text-xs font-semibold text-glow">{formatValue(item.market_value)}</p>
                          {item.category && (
                            <p className="text-foreground/40 text-[10px] mt-1">{item.category}</p>
                          )}
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </ScreenLayout>
  );
};

export default PerfilUsuario;
