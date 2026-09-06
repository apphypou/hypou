import { ArrowLeft, ChevronRight, Loader2, Check, Trash2 } from "lucide-react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useNavigate } from "react-router-dom";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBlockedUsers, unblockUser } from "@/services/reportService";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { saveUserCategories } from "@/services/profileService";
import { categories as ALL_CATEGORIES } from "@/constants/categories";
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
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/utils";

const Configuracoes = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    App.getInfo().then(({ version, build }) => {
      if (active) setAppVersion(`${version} (${build})`);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  // Change password state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Blocked users state
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);

  // Pending-resume preference (mostra "Você curtiu! Monte sua oferta" ao voltar para o Explorar)
  const [disablePendingResume, setDisablePendingResume] = useState(
    typeof window !== "undefined" && localStorage.getItem("hypou:disable-pending-resume") === "1"
  );
  const togglePendingResume = () => {
    const next = !disablePendingResume;
    setDisablePendingResume(next);
    if (next) {
      localStorage.setItem("hypou:disable-pending-resume", "1");
      sessionStorage.removeItem("hypou:pending-like-item");
      toast({ title: "Lembrete desativado", description: "Não vamos mais reabrir a proposta ao voltar para o Explorar." });
    } else {
      localStorage.removeItem("hypou:disable-pending-resume");
      toast({ title: "Lembrete ativado" });
    }
  };

  // Categories preferences state
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [savingCategories, setSavingCategories] = useState(false);

  useRealtimeInvalidate(
    user
      ? [{ table: "blocked_users", filter: `blocker_id=eq.${user.id}`, invalidateKeys: [["blocked-users", user.id]] }]
      : [],
    !!user
  );

  const { data: blockedUsers = [], refetch: refetchBlocked } = useQuery({
    queryKey: ["blocked-users", user?.id],
    queryFn: () => getBlockedUsers(user!.id),
    enabled: !!user && blockedDialogOpen,
  });

  useEffect(() => {
    if (!categoriesDialogOpen || !user) return;
    (async () => {
      const { data } = await supabase
        .from("user_categories")
        .select("category")
        .eq("user_id", user.id);
      setSelectedCategories((data || []).map((r: any) => r.category));
    })();
  }, [categoriesDialogOpen, user]);

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  const handleSaveCategories = async () => {
    if (!user) return;
    setSavingCategories(true);
    try {
      await saveUserCategories(user.id, selectedCategories);
      queryClient.invalidateQueries({ queryKey: ["recommended-items"] });
      queryClient.invalidateQueries({ queryKey: ["explore-items"] });
      toast({ title: "Categorias atualizadas! ✨" });
      setCategoriesDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar categorias", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSavingCategories(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate("/");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Senha alterada com sucesso! 🔒" });
      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Erro ao alterar senha", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast({ title: "Conta excluída. Até logo! 👋" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Erro ao excluir conta", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    if (!user) return;
    try {
      await unblockUser(user.id, blockedId);
      refetchBlocked();
      toast({ title: "Usuário desbloqueado" });
    } catch {
      toast({ title: "Erro ao desbloquear", variant: "destructive" });
    }
  };

  const groups = [
    { title: "Conta", items: [
      { label: "Alterar senha", onClick: () => setPasswordDialogOpen(true) },
      { label: "Pessoas bloqueadas", onClick: () => setBlockedDialogOpen(true) },
    ] },
    { title: "Preferências", items: [
      { label: "Interesses", onClick: () => setCategoriesDialogOpen(true) },
    ] },
    { title: "Informações", items: [
      { label: "Termos de uso", onClick: () => navigate("/termos") },
      { label: "Política de privacidade", onClick: () => navigate("/privacidade") },
      { label: "Sobre o Hypou", onClick: () => setAboutOpen(true) },
    ] },
  ];

  return (
    <ScreenLayout refreshable={false}>
      <header className="flex shrink-0 items-center gap-2 px-4 py-3">
        <button type="button" aria-label="Voltar" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
      </header>

      <main className="min-h-0 flex-1 w-full px-5 overflow-y-auto pb-[calc(8rem+var(--safe-area-bottom))]">
        {groups.map((group) => (
          <section key={group.title} aria-label={group.title} className="mt-5">
            <h2 className="mb-2 px-4 text-xs font-medium text-foreground/60">{group.title}</h2>
            <div className="overflow-hidden rounded-2xl bg-foreground/[0.04]">
              {group.items.map((item, index) => (
                <button key={item.label} type="button" onClick={item.onClick} className={`flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left text-[15px] active:bg-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${index ? "border-t border-foreground/[0.07]" : ""}`}>
                  <span>{item.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-foreground/40" aria-hidden />
                </button>
              ))}
              {group.title === "Preferências" && (
                <div className="flex items-center justify-between gap-4 border-t border-foreground/[0.07] px-4 py-4">
                  <div>
                    <label htmlFor="proposal-reminder" className="text-[15px]">Lembrete de proposta</label>
                    <p id="proposal-reminder-description" className="mt-1 max-w-64 text-xs leading-relaxed text-foreground/60">Lembrar de montar uma oferta ao voltar ao Explorar.</p>
                  </div>
                  <button id="proposal-reminder" type="button" role="switch" aria-checked={!disablePendingResume} aria-label="Lembrete de proposta" aria-describedby="proposal-reminder-description" onClick={togglePendingResume} className="group flex min-h-11 w-12 shrink-0 items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                    <span className={`flex h-7 w-12 items-center rounded-full p-0.5 transition-colors ${disablePendingResume ? "bg-foreground/25" : "bg-primary"}`}>
                      <span className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${disablePendingResume ? "translate-x-0" : "translate-x-5"}`} />
                    </span>
                  </button>
                </div>
              )}
            </div>
          </section>
        ))}
        <button type="button" disabled={loggingOut} onClick={handleLogout} className="mt-6 flex min-h-14 w-full items-center gap-3 rounded-2xl bg-foreground/[0.04] px-4 py-3 text-left text-[15px] disabled:opacity-50">
          {loggingOut && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {loggingOut ? "Saindo…" : "Sair da conta"}
        </button>
        <button type="button" onClick={() => setDeleteConfirmOpen(true)} className="mt-3 min-h-11 rounded-lg px-4 py-2 text-sm text-destructive">Excluir conta</button>
        <p className="mt-5 px-4 text-xs text-foreground/50">Hypou{appVersion ? ` · ${appVersion}` : ""}</p>
      </main>

      <BottomNav activeTab="perfil" />

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="bg-card border-foreground/10">
          <DialogHeader><DialogTitle>Sobre o Hypou</DialogTitle></DialogHeader>
          <p className="text-sm leading-relaxed text-foreground/70">Encontre itens, descubra interesses em comum e combine trocas com outras pessoas.</p>
          <a href="mailto:hypouapp@gmail.com" className="py-2 text-sm text-primary underline underline-offset-4">hypouapp@gmail.com</a>
          {appVersion && <p className="text-xs text-foreground/50">Versão {appVersion}</p>}
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="bg-card border-foreground/10">
          <DialogHeader>
            <DialogTitle className="text-foreground">Alterar Senha</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nova Senha</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="bg-background border-foreground/10"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Confirmar Senha</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="bg-background border-foreground/10"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar Nova Senha
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Blocked Users Dialog */}
      <Dialog open={blockedDialogOpen} onOpenChange={setBlockedDialogOpen}>
        <DialogContent className="bg-card border-foreground/10">
          <DialogHeader>
            <DialogTitle className="text-foreground">Usuários Bloqueados</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3 max-h-64 overflow-y-auto">
            {blockedUsers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Nenhum usuário bloqueado
              </p>
            ) : (
              blockedUsers.map((blocked: any) => (
                <div key={blocked.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-foreground/5">
                  {blocked.avatar_url ? (
                    <img src={blocked.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground/30">
                      {(blocked.display_name || "?")[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{blocked.display_name || "Usuário"}</p>
                  </div>
                  <button
                    onClick={() => handleUnblock(blocked.user_id)}
                    className="text-xs font-bold text-primary uppercase tracking-wider"
                  >
                    Desbloquear
                  </button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories Preferences Dialog */}
      <Dialog open={categoriesDialogOpen} onOpenChange={setCategoriesDialogOpen}>
        <DialogContent className="bg-card border-foreground/10 max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground">Categorias de Interesse</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between -mt-1">
            <p className="text-xs text-muted-foreground">
              Escolha o que você quer ver no Explorar.
            </p>
            <button
              type="button"
              onClick={() =>
                setSelectedCategories(
                  selectedCategories.length === ALL_CATEGORIES.length
                    ? []
                    : ALL_CATEGORIES.map((c) => c.label)
                )
              }
              className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5 shrink-0"
            >
              {selectedCategories.length === ALL_CATEGORIES.length ? "Limpar todas" : "Selecionar todas"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 overflow-y-auto no-scrollbar py-2">
            {ALL_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.label);
              return (
                <div
                  key={cat.label}
                  onClick={() => toggleCategory(cat.label)}
                  className={`group relative rounded-2xl bg-background cursor-pointer transition-all active:scale-95 flex items-center gap-2 px-3 py-3 overflow-hidden ${
                    isSelected
                      ? "border border-primary ring-1 ring-primary/50"
                      : "border border-foreground/5"
                  }`}
                >
                  <span className="text-lg shrink-0">{cat.emoji}</span>
                  <span className={`text-xs flex-1 min-w-0 truncate ${isSelected ? "font-semibold text-foreground" : "font-medium text-foreground/60"}`}>
                    {cat.label}
                  </span>
                  {isSelected && (
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={handleSaveCategories}
            disabled={savingCategories}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingCategories && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar Preferências
          </button>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-card border-foreground/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Trash2 className="h-5 w-5 text-destructive" />
              Excluir Conta
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir sua conta permanentemente? Todos os seus itens, trocas e dados serão apagados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScreenLayout>
  );
};

export default Configuracoes;
