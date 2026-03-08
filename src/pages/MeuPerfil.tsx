import { ArrowLeft, Settings, MapPin, Pencil, PlusCircle, Camera, Loader2, Trash2, AlertTriangle, Edit3, Star, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import GlassCard from "@/components/GlassCard";
import IconButton from "@/components/IconButton";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, uploadAvatar } from "@/services/profileService";
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
import { useQueryClient } from "@tanstack/react-query";
import { uploadVideo } from "@/services/videoService";

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
      // bio is not in updateProfile params, update directly
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
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
      await supabase.from("item_images").delete().eq("item_id", itemId);
      await supabase.from("items").delete().eq("id", itemId);
      await refetchItems();
      queryClient.invalidateQueries({ queryKey: ["my-items"] });
      toast({ title: "Item removido!" });
    } catch {
      toast({ title: "Erro ao remover item", variant: "destructive" });
    }
  };

  const formatValue = (cents: number) => {
    return `R$ ${(cents / 100).toLocaleString("pt-BR")}`;
  };

  const ratingDisplay = stats?.rating
    ? `${stats.rating}★`
    : "--";

  const statsList = [
    { value: String(stats?.totalTrades ?? 0), label: "Trocas", highlight: false },
    { value: ratingDisplay, label: "Rating", highlight: !!stats?.rating },
    { value: String(stats?.totalProposals ?? 0), label: "Propostas", highlight: false },
  ];

  if (isLoading) {
    return (
      <ScreenLayout>
        <header className="relative z-40 flex w-full justify-between items-center px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <IconButton icon={ArrowLeft} size="sm" onClick={() => navigate(-1)} />
            <span className="text-sm font-bold tracking-wider uppercase text-foreground/80">Meu Perfil</span>
          </div>
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
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} size="sm" onClick={() => navigate(-1)} />
          <span className="text-sm font-bold tracking-wider uppercase text-foreground/80">Meu Perfil</span>
        </div>
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
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center border-2 border-background"
              >
                <Camera className="h-4 w-4 text-primary-foreground" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              {profile?.onboarding_completed && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gray-900 to-black border border-primary/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg w-max">
                  <span className="text-primary text-[14px]">✓</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white">Conta Verificada</span>
                </div>
              )}
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
          <div className="w-full grid grid-cols-3 gap-3 mb-8">
            {statsList.map((stat) => (
              <GlassCard
                key={stat.label}
                className={`rounded-2xl p-3 flex flex-col items-center justify-center text-center ${
                  stat.highlight ? "border-primary/20 bg-primary/5" : ""
                }`}
              >
                <span className={`text-xl font-bold mb-0.5 ${stat.highlight ? "text-primary" : "text-foreground"}`}>
                  {stat.value}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-semibold ${
                    stat.highlight ? "text-primary/60" : "text-foreground/40"
                  }`}
                >
                  {stat.label}
                </span>
              </GlassCard>
            ))}
          </div>

          {/* Meus Itens */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Meus Itens</h2>
              <button
                onClick={() => navigate("/novo-item")}
                className="text-primary text-xs font-bold tracking-wide uppercase hover:text-foreground transition-colors flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                Novo Item
              </button>
            </div>

            {items.length === 0 ? (
              <GlassCard className="p-8 flex flex-col items-center gap-3">
                <PlusCircle className="h-10 w-10 text-foreground/20" />
                <p className="text-foreground/40 text-sm text-center">Nenhum item cadastrado ainda</p>
                <button
                  onClick={() => navigate("/novo-item")}
                  className="text-primary text-xs font-bold uppercase tracking-wider"
                >
                  Cadastrar primeiro item
                </button>
              </GlassCard>
            ) : (
              <div className="space-y-3 pb-24">
                {items.map((item) => {
                  const mainImage = item.item_images?.sort((a: any, b: any) => a.position - b.position)[0];
                  return (
                    <GlassCard
                      key={item.id}
                      hoverable
                      className="p-3 flex gap-4 active:scale-[0.99] cursor-pointer"
                      onClick={() => navigate(`/editar-item/${item.id}`)}
                    >
                      <div className="h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-muted border border-foreground/10">
                        {mainImage ? (
                          <img
                            alt={item.name}
                            className="w-full h-full object-cover opacity-80"
                            src={mainImage.image_url}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/20 text-xs">
                            Sem foto
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center gap-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-primary tracking-wider uppercase">{item.category}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteItemId(item.id); }}
                            className="text-foreground/30 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <h3 className="text-base font-bold text-foreground leading-tight">{item.name}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-foreground/40 text-xs font-medium">Valor de mercado</span>
                          <span className="text-foreground font-bold text-sm">{formatValue(item.market_value)}</span>
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
