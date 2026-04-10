import { ArrowLeft, MapPin, Star, Ban, MoreVertical, Flag, Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatValue } from "@/lib/utils";
import ScreenLayout from "@/components/ScreenLayout";
import GlassCard from "@/components/GlassCard";
import { SkeletonProfile, SkeletonItemCard } from "@/components/SkeletonCard";
import { useUserRating } from "@/hooks/useRatings";
import { useAuth } from "@/hooks/useAuth";
import { blockUser } from "@/services/reportService";
import { createReport } from "@/services/reportService";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
const PerfilUsuario = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: rating } = useUserRating(userId);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reporting, setReporting] = useState(false);

  const isOwnProfile = user?.id === userId;

  const handleBlock = async () => {
    if (!user || !userId) return;
    setBlocking(true);
    try {
      await blockUser(user.id, userId);
      toast({ title: "Usuário bloqueado 🚫", description: "Você não verá mais itens deste usuário." });
      setBlockConfirmOpen(false);
      navigate(-1);
    } catch {
      toast({ title: "Erro ao bloquear", variant: "destructive" });
    } finally {
      setBlocking(false);
    }
  };

  const handleReport = async () => {
    if (!user || !userId || !reportReason) return;
    setReporting(true);
    try {
      await createReport(user.id, userId, reportReason, reportDesc || undefined);
      toast({ title: "Denúncia enviada", description: "Vamos analisar o caso." });
      setReportOpen(false);
      setReportReason("");
      setReportDesc("");
    } catch {
      toast({ title: "Erro ao enviar denúncia", variant: "destructive" });
    } finally {
      setReporting(false);
    }
  };

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_profiles" as any)
        .select("user_id, display_name, avatar_url, bio, location")
        .eq("user_id", userId!)
        .single();
      if (error) throw error;
      return data as any;
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
        <h1 className="text-foreground text-lg font-bold tracking-tight flex-1">Perfil</h1>
        {!isOwnProfile && user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-10 w-10 flex items-center justify-center rounded-full text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-all">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-foreground/10">
              <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-foreground gap-2">
                <Flag className="h-4 w-4" />
                Denunciar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBlockConfirmOpen(true)} className="text-destructive gap-2 focus:text-destructive">
                <Ban className="h-4 w-4" />
                Bloquear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
              {rating && (
                <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <span className="text-sm font-bold text-primary">{rating.average}</span>
                  <span className="text-xs text-muted-foreground">({rating.count} avaliação{rating.count !== 1 ? "ões" : ""})</span>
                </div>
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

      {/* Block Confirm Dialog */}
      <AlertDialog open={blockConfirmOpen} onOpenChange={setBlockConfirmOpen}>
        <AlertDialogContent className="bg-card border-foreground/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Ban className="h-5 w-5 text-destructive" />
              Bloquear Usuário
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Ao bloquear, você não verá mais itens deste usuário e ele não poderá interagir com os seus. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              disabled={blocking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {blocking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Bloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="bg-card border-foreground/10">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              Denunciar Usuário
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Motivo</p>
              <div className="flex flex-wrap gap-2">
                {["Golpe", "Conteúdo impróprio", "Assédio", "Perfil falso", "Outro"].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setReportReason(reason)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                      reportReason === reason
                        ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                        : "bg-foreground/5 border border-foreground/10 text-foreground/70 hover:border-foreground/20 hover:text-foreground"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Detalhes (opcional)</p>
              <Textarea
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Descreva o que aconteceu..."
                rows={3}
                className="bg-foreground/5 border-foreground/10 resize-none focus:border-primary/50"
              />
            </div>
            <button
              onClick={handleReport}
              disabled={!reportReason || reporting}
              className="w-full py-3 rounded-full bg-destructive text-white font-bold text-sm uppercase tracking-wider disabled:opacity-30 flex items-center justify-center gap-2 hover:bg-destructive/90 transition-all"
            >
              {reporting && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar Denúncia
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </ScreenLayout>
  );
};

export default PerfilUsuario;
