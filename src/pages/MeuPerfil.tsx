import { Settings, MapPin, Pencil, PlusCircle, Camera, Loader2, Trash2, AlertTriangle, Edit3, Star, Bookmark, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import GlassCard from "@/components/GlassCard";
import IconButton from "@/components/IconButton";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, uploadAvatar } from "@/services/profileService";
import { getFavorites } from "@/services/favoriteService";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatValue } from "@/lib/utils";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { uploadVideo } from "@/services/videoService";
import { softDeleteItem } from "@/services/itemService";
import { isNativePlatform, pickAvatar } from "@/lib/nativeCamera";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import MediaViewerDialog, { type MediaViewerItem } from "@/components/MediaViewerDialog";
import { useUserRatingsList } from "@/hooks/useRatings";

const MeuPerfil = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, items, stats, isLoading, refetchProfile, refetchItems } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Edit profile state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingVideoItemId, setUploadingVideoItemId] = useState<string | null>(null);
  const [mediaViewer, setMediaViewer] = useState<MediaViewerItem | null>(null);
  const [showRatings, setShowRatings] = useState(false);
  const { data: receivedRatings = [], isLoading: loadingRatings } = useUserRatingsList(showRatings ? user?.id : undefined);

  // Favorites
  const [showFavorites, setShowFavorites] = useState(false);
  useRealtimeInvalidate(
    user
      ? [{ table: "favorites", filter: `user_id=eq.${user.id}`, invalidateKeys: [["my-favorites", user.id]] }]
      : [],
    !!user
  );
  const { data: favorites = [], isLoading: loadingFavorites } = useQuery({
    queryKey: ["my-favorites", user?.id],
    queryFn: () => getFavorites(user!.id),
    enabled: !!user && showFavorites,
  });

  const openEdit = () => {
    setEditName(profile?.display_name ?? "");
    setEditLocation(profile?.location ?? "");
    setEditBio(profile?.bio ?? "");
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, {
        display_name: editName,
        location: editLocation,
      });
      await supabase.from("profiles").update({ bio: editBio }).eq("user_id", user.id);
      await refetchProfile();
      setEditOpen(false);
      toast({ title: "Perfil atualizado!" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    
    let file: File | undefined;
    
    if (isNativePlatform()) {
      const result = await pickAvatar();
      if (!result) return;
      file = result.file;
    } else {
      file = e?.target?.files?.[0];
      if (!file) return;
    }

    setSaving(true);
    try {
      const url = await uploadAvatar(user.id, file);
      await updateProfile(user.id, { avatar_url: url });
      await refetchProfile();
      toast({ title: "Foto atualizada!" });
    } catch {
      toast({ title: "Erro ao enviar foto", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await softDeleteItem(itemId);
      await refetchItems();
      queryClient.invalidateQueries({ queryKey: ["my-items"] });
      toast({ title: "Item removido!" });
    } catch {
      toast({ title: "Erro ao remover item", variant: "destructive" });
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !uploadingVideoItemId) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Vídeo muito grande (máx 50MB)", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await uploadVideo(user.id, uploadingVideoItemId, file);
      toast({ title: "Vídeo enviado! 🎬" });
      queryClient.invalidateQueries({ queryKey: ["shorts-feed"] });
    } catch {
      toast({ title: "Erro ao enviar vídeo", variant: "destructive" });
    } finally {
      setSaving(false);
      setUploadingVideoItemId(null);
      e.target.value = "";
    }
  };

  const ratingDisplay = stats?.rating
    ? `${stats.rating}★`
    : "--";

  const statsList = [
    { value: String(stats?.totalTrades ?? 0), label: "Trocas", highlight: false },
    { value: ratingDisplay, label: "avaliações", highlight: !!stats?.rating },
    { value: String(stats?.totalProposals ?? 0), label: "Propostas", highlight: false },
  ];

  if (isLoading) {
    return (
      <ScreenLayout>
        <header className="relative z-40 flex w-full justify-between items-center px-6 pt-3 pb-4 shrink-0">
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight">Perfil</h1>
        </header>
        <main className="flex-1 w-full px-5 flex flex-col items-center gap-4 pt-8">
          <Skeleton className="h-32 w-32 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="w-full grid grid-cols-3 gap-3 mt-4">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </main>
        <BottomNav activeTab="perfil" />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-3 pb-4 shrink-0">
        <h1 className="text-foreground text-3xl font-extrabold tracking-tight">Perfil</h1>
        <IconButton icon={Settings} size="sm" onClick={() => navigate("/configuracoes")} />
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-y-auto no-scrollbar pb-6">
        <div className="px-5 flex flex-col items-center">
          {/* Profile Section */}
          <div className="relative mt-2 mb-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="h-32 w-32 rounded-full p-1 border-2 border-primary neon-glow bg-background">
                <img
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full opacity-90 hover:opacity-100 transition-opacity"
                  src={profile?.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(profile?.display_name || "U")}
                />
              </div>
              <button
                onClick={() => isNativePlatform() ? handleAvatarChange() : avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center border-2 border-background"
              >
                <Camera className="h-4 w-4 text-primary-foreground" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
              {profile?.display_name || "Sem nome"}
            </h1>
            {profile?.location && (
              <div className="flex items-center gap-1.5 text-foreground/50 text-sm mb-2">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile?.bio && (
              <p className="text-foreground/40 text-sm mb-4 max-w-xs">{profile.bio}</p>
            )}

            <button
              onClick={openEdit}
              className="group relative px-6 py-2.5 rounded-full border border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="text-primary text-xs font-bold tracking-widest uppercase group-hover:text-glow transition-all">
                Editar Perfil
              </span>
              <Pencil className="h-4 w-4 text-primary" />
            </button>
          </div>

          {/* Stats */}
          <div className="w-full grid grid-cols-3 gap-2.5 mb-7">
            {statsList.map((stat) => (
              <button
                key={stat.label}
                type="button"
                onClick={() => stat.label === "avaliações" && setShowRatings(true)}
                disabled={stat.label !== "avaliações"}
                className={`rounded-2xl px-4 py-3 flex flex-col items-center justify-center text-center bg-card/75 border-foreground/8 ${
                  stat.highlight ? "border-primary/16 bg-primary/[0.04]" : ""
                }`}
              >
                <span className={`text-xl font-bold mb-0.5 ${stat.highlight ? "text-primary" : "text-foreground"}`}>
                  {stat.value}
                </span>
                <span
                  className={`mt-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                    stat.highlight ? "text-primary/60" : "text-foreground/40"
                  }`}
                >
                  {stat.label}
                </span>
              </button>
            ))}
          </div>

          {/* ===== CADASTRAR NOVO ITEM (CTA central) ===== */}
          <button
            onClick={() => navigate("/novo-item")}
            className="w-full h-[52px] mb-6 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-[0_8px_24px_hsl(var(--primary)/0.18)] active:scale-[0.99] transition-transform"
          >
            <PlusCircle className="h-5 w-5" />
            Cadastrar novo item
          </button>

          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center gap-5 border-b border-foreground/10 px-1">
              <button
                type="button"
                onClick={() => setShowFavorites(false)}
                className={`border-b-2 pb-2 text-lg font-bold tracking-tight transition-colors ${
                  !showFavorites ? "border-primary text-foreground" : "border-transparent text-foreground/45"
                }`}
              >
                Meus Itens
              </button>
              <button
                type="button"
                onClick={() => setShowFavorites(true)}
                className={`border-b-2 pb-2 text-lg font-bold tracking-tight transition-colors ${
                  showFavorites ? "border-primary text-foreground" : "border-transparent text-foreground/45"
                }`}
              >
                Itens Salvos
              </button>
            </div>

            {showFavorites ? (
              loadingFavorites ? (
                <div className="space-y-3 pb-24">
                  <Skeleton className="h-28 rounded-2xl" />
                  <Skeleton className="h-28 rounded-2xl" />
                </div>
              ) : favorites.length === 0 ? (
                <GlassCard className="mb-24 p-5 flex flex-col items-center gap-2.5 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Bookmark className="h-7 w-7 text-primary/50" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Nenhum item salvo</h3>
                  <p className="text-muted-foreground text-sm max-w-[280px] leading-relaxed">
                    Salve itens no Explorar para voltar a eles depois.
                  </p>
                </GlassCard>
              ) : (
                <div className="space-y-3 pb-24">
                  {favorites.map((item: any) => {
                    const mainImage = [...(item.item_images || [])].sort((a: any, b: any) => a.position - b.position)[0];
                    return (
                      <GlassCard
                        key={item.id}
                        hoverable
                        onClick={() => navigate("/explorar", { state: { focusedItem: item } })}
                        className="p-3 flex gap-4 active:scale-[0.99] cursor-pointer"
                      >
                        <div className="h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-muted border border-foreground/10">
                          {mainImage ? (
                            <img alt={item.name} className="w-full h-full object-cover opacity-80" src={mainImage.image_url} draggable={false} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-foreground/20 text-xs">Sem foto</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                          <span className="text-[10px] font-bold text-primary tracking-wider uppercase">{item.category}</span>
                          <h3 className="text-base font-bold text-foreground leading-tight truncate">{item.name}</h3>
                          <span className="text-xs text-foreground/45 truncate">{item.profiles?.display_name || "Usuário"}</span>
                          <span className="text-primary text-sm font-semibold">{formatValue(item.market_value)}</span>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              )
            ) : items.length === 0 ? (
                <GlassCard className="mb-24 p-5 flex flex-col items-center gap-2.5 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <PlusCircle className="h-7 w-7 text-primary/50" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Seu primeiro item muda tudo</h3>
                  <p className="text-muted-foreground text-sm max-w-[280px] leading-relaxed">
                    Cadastre algo parado em casa para aparecer no Explorar e receber propostas.
                  </p>
                </GlassCard>
            ) : (
                <div className="space-y-3 pb-24">
                  {items.map((item: any) => {
                    const mainImage = item.item_images?.sort((a: any, b: any) => a.position - b.position)[0];
                    return (
                      <GlassCard
                        key={item.id}
                        hoverable
                        onClick={() => navigate(`/editar-item/${item.id}`)}
                        className="p-3 flex gap-4 active:scale-[0.99] cursor-pointer relative"
                      >
                        {item.is_traded && (
                          <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full bg-emerald-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow-lg">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Trocado
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-2 z-10">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/editar-item/${item.id}`); }}
                            className="text-foreground/30 hover:text-primary transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteItemId(item.id); }}
                            className="text-foreground/30 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/editar-item/${item.id}`);
                          }}
                          className="h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-muted border border-foreground/10"
                        >
                          {mainImage ? (
                            <img
                              alt={item.name}
                              className="w-full h-full object-cover opacity-80"
                              src={mainImage.image_url}
                              draggable={false}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-foreground/20 text-xs">
                              Sem foto
                            </div>
                          )}
                        </button>
                        <div className="flex-1 flex flex-col justify-center gap-1">
                          <span className="text-[10px] font-bold text-primary tracking-wider uppercase">{item.category}</span>
                          <h3 className="text-base font-bold text-foreground leading-tight">{item.name}</h3>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-foreground/40 text-xs font-medium">Valor de mercado</span>
                            <span className="text-primary text-sm font-semibold">{formatValue(item.market_value)}</span>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav activeTab="perfil" />
      <MediaViewerDialog media={mediaViewer} onOpenChange={(open) => !open && setMediaViewer(null)} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />

      <Sheet open={showRatings} onOpenChange={setShowRatings}>
        <SheetContent side="bottom" className="max-h-[78dvh] rounded-t-[2rem] border-foreground/10 bg-background px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle>Avaliações recebidas</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 overflow-y-auto pb-4">
            {loadingRatings ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Carregando avaliações...</p>
            ) : receivedRatings.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Você ainda não recebeu avaliações.</p>
            ) : (
              receivedRatings.map((rating) => (
                <div key={rating.id} className="rounded-2xl border border-foreground/10 bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-foreground">{rating.rater?.display_name || "Usuário"}</span>
                    <span className="flex items-center gap-1 text-sm font-bold text-primary">
                      {rating.score.toFixed(1)} <Star className="h-4 w-4 fill-current" />
                    </span>
                  </div>
                  {rating.comment && <p className="mt-2 text-sm text-muted-foreground">{rating.comment}</p>}
                  {rating.rater_item?.name && (
                    <p className="mt-3 text-xs text-muted-foreground">Troca envolvendo {rating.rater_item.name}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Profile Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="bg-background border-t border-foreground/10 rounded-t-3xl px-6 pb-8">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-foreground text-lg font-bold">Editar Perfil</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-foreground/60 text-xs font-bold uppercase tracking-wider mb-1.5 block">Nome</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Seu nome" className="bg-muted/50 border-foreground/10" />
            </div>
            <div>
              <label className="text-foreground/60 text-xs font-bold uppercase tracking-wider mb-1.5 block">Localização</label>
              <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Cidade, Estado" className="bg-muted/50 border-foreground/10" />
            </div>
            <div>
              <label className="text-foreground/60 text-xs font-bold uppercase tracking-wider mb-1.5 block">Bio</label>
              <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Conte um pouco sobre você..." rows={3} className="bg-muted/50 border-foreground/10 resize-none" />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest mt-2 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent className="bg-background border-foreground/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remover Item
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este item? Esta ação não pode ser desfeita e todas as fotos serão apagadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteItemId) {
                  handleDeleteItem(deleteItemId);
                  setDeleteItemId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScreenLayout>
  );
};

export default MeuPerfil;
