import { ArrowLeft, LogOut, Info, Smartphone, ChevronRight, Sun, Moon, Lock, Trash2, Ban, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import IconButton from "@/components/IconButton";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBlockedUsers, unblockUser } from "@/services/reportService";
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

const Configuracoes = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);

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

  const { data: blockedUsers = [], refetch: refetchBlocked } = useQuery({
    queryKey: ["blocked-users", user?.id],
    queryFn: () => getBlockedUsers(user!.id),
    enabled: !!user && blockedDialogOpen,
  });

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
      toast({ title: "Erro ao alterar senha", description: err.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Delete user data
      await supabase.from("favorites").delete().eq("user_id", user.id);
      await supabase.from("swipes").delete().eq("swiper_id", user.id);
      await supabase.from("user_categories").delete().eq("user_id", user.id);
      
      // Get user items
      const { data: userItems } = await supabase.from("items").select("id").eq("user_id", user.id);
      if (userItems) {
        for (const item of userItems) {
          await supabase.from("item_images").delete().eq("item_id", item.id);
        }
        await supabase.from("items").delete().eq("user_id", user.id);
      }

      await supabase.from("profiles").delete().eq("user_id", user.id);
      await signOut();
      toast({ title: "Conta excluída. Até logo! 👋" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Erro ao excluir conta", description: err.message, variant: "destructive" });
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

  const menuItems = [
    {
      icon: theme === "dark" ? Sun : Moon,
      label: theme === "dark" ? "Modo Claro" : "Modo Escuro",
      description: theme === "dark" ? "Trocar para o tema claro" : "Trocar para o tema escuro",
      onClick: toggleTheme,
    },
    {
      icon: Lock,
      label: "Alterar Senha",
      description: "Trocar a senha da sua conta",
      onClick: () => setPasswordDialogOpen(true),
    },
    {
      icon: Ban,
      label: "Usuários Bloqueados",
      description: "Gerenciar usuários bloqueados",
      onClick: () => setBlockedDialogOpen(true),
    },
    {
      icon: Info,
      label: "Sobre o Hypou",
      description: "Conheça mais sobre a plataforma",
      onClick: undefined,
    },
    {
      icon: Smartphone,
      label: "Versão do App",
      description: "v1.1.0",
      onClick: undefined,
    },
  ];

  return (
    <ScreenLayout>
      <header className="relative z-40 flex w-full items-center gap-3 px-6 pt-12 pb-4">
        <IconButton icon={ArrowLeft} size="sm" onClick={() => navigate(-1)} />
        <span className="text-sm font-bold tracking-wider uppercase text-foreground/80">Configurações</span>
      </header>

      <main className="flex-1 w-full px-5 overflow-y-auto no-scrollbar pb-28">
        <div className="flex flex-col gap-3 mt-2">
          {menuItems.map((item) => (
            <GlassCard
              key={item.label}
              hoverable={!!item.onClick}
              className="p-4 flex items-center gap-4"
              onClick={item.onClick}
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-foreground font-semibold text-sm">{item.label}</h3>
                <p className="text-foreground/40 text-xs">{item.description}</p>
              </div>
              {item.onClick && <ChevronRight className="h-4 w-4 text-foreground/30" />}
            </GlassCard>
          ))}

          {/* Delete Account */}
          <GlassCard
            hoverable
            className="p-4 flex items-center gap-4 mt-2 border-destructive/20"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-destructive font-semibold text-sm">Excluir Conta</h3>
              <p className="text-foreground/40 text-xs">Apagar permanentemente sua conta</p>
            </div>
          </GlassCard>

          {/* Logout */}
          <GlassCard
            hoverable
            className="p-4 flex items-center gap-4 mt-2 border-danger/20"
            onClick={handleLogout}
          >
            <div className="h-10 w-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
              {loggingOut ? (
                <Loader2 className="h-5 w-5 text-danger animate-spin" />
              ) : (
                <LogOut className="h-5 w-5 text-danger" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-danger font-semibold text-sm">Sair da Conta</h3>
              <p className="text-foreground/40 text-xs">Encerrar sessão atual</p>
            </div>
          </GlassCard>
        </div>
      </main>

      <BottomNav activeTab="perfil" />

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
