import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MailPlus, RefreshCw, ShieldCheck, UserMinus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Role = "admin" | "moderator";
type Member = {
  user_id: string;
  role: Role;
  email: string | null;
  status: "active" | "invited";
  lastAccessAt: string | null;
  profile: { display_name: string | null; avatar_url: string | null; created_at: string } | null;
};

async function invoke(action: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-members", { body: { action, ...extra } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

const AdminMembers = () => {
  const client = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("moderator");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => (await invoke("list")).members as Member[],
  });

  const refresh = () => client.invalidateQueries({ queryKey: ["admin-members"] });

  const invite = async () => {
    setBusyId("invite");
    try {
      await invoke("invite", { email, role });
      setEmail("");
      setOpen(false);
      await refresh();
      toast({ title: "Convite enviado", description: "A pessoa receberá um e-mail para ativar o acesso ao painel." });
    } catch (error) {
      toast({ title: "Não foi possível enviar o convite", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (member: Member, nextRole: Role) => {
    if (member.role === nextRole) return;
    setBusyId(member.user_id);
    try {
      await invoke("set_role", { userId: member.user_id, role: nextRole });
      await refresh();
      toast({ title: "Função atualizada" });
    } catch (error) {
      toast({ title: "Não foi possível alterar a função", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async (member: Member) => {
    if (!window.confirm(`Revogar o acesso de ${member.email || "este membro"} ao painel? A conta do aplicativo será preservada.`)) return;
    setBusyId(member.user_id);
    try {
      await invoke("set_role", { userId: member.user_id, role: "user" });
      await refresh();
      toast({ title: "Acesso revogado", description: "A conta continua existindo, sem acesso administrativo." });
    } catch (error) {
      toast({ title: "Não foi possível revogar o acesso", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const resend = async (member: Member) => {
    setBusyId(member.user_id);
    try {
      await invoke("resend_invite", { userId: member.user_id });
      toast({ title: "Convite reenviado" });
    } catch (error) {
      toast({ title: "Não foi possível reenviar o convite", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-3xl font-bold tracking-tight">Membros do painel</h1><p className="mt-1 text-sm text-muted-foreground">Acesso exclusivo para administradores e moderadores.</p></div>
      <Button className="rounded-xl" onClick={() => setOpen(true)}><MailPlus className="mr-2 h-4 w-4" />Convidar membro</Button>
    </div>
    <Card className="brand-card"><CardContent className="p-0">
      {members.length ? <div className="divide-y divide-border">{members.map((member) => {
        const busy = busyId === member.user_id;
        return <div key={member.user_id} className="flex flex-wrap items-center gap-3 p-4">
          <Avatar><AvatarImage src={member.profile?.avatar_url || ""} /><AvatarFallback>{(member.profile?.display_name || member.email || "A")[0].toUpperCase()}</AvatarFallback></Avatar>
          <div className="min-w-[180px] flex-1"><p className="font-medium">{member.profile?.display_name || "Membro convidado"}</p><p className="truncate text-xs text-muted-foreground">{member.email || "E-mail indisponível"}</p><p className="mt-1 text-xs text-muted-foreground">{member.lastAccessAt ? `Último acesso ${formatDistanceToNow(new Date(member.lastAccessAt), { addSuffix: true, locale: ptBR })}` : "Ainda não acessou"}</p></div>
          <Badge variant={member.status === "active" ? "default" : "secondary"} className="rounded-full">{member.status === "active" ? "Ativo" : "Convite pendente"}</Badge>
          <Select value={member.role} onValueChange={(value) => changeRole(member, value as Role)} disabled={busy}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="moderator">Moderador</SelectItem><SelectItem value="admin">Administrador</SelectItem></SelectContent></Select>
          {member.status === "invited" && <Button aria-label={`Reenviar convite para ${member.email || "membro"}`} variant="outline" size="icon" disabled={busy} onClick={() => resend(member)}><RefreshCw className="h-4 w-4" /></Button>}
          <Button aria-label={`Revogar acesso de ${member.email || "membro"}`} variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => revoke(member)}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}</Button>
        </div>;
      })}</div> : <div className="py-16 text-center text-sm text-muted-foreground"><Users className="mx-auto mb-3 h-10 w-10 opacity-30" />Nenhum membro adicional encontrado.</div>}
    </CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Convidar membro</DialogTitle></DialogHeader><div className="space-y-4"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@empresa.com" /><Select value={role} onValueChange={(value) => setRole(value as Role)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="moderator">Moderador</SelectItem><SelectItem value="admin">Administrador</SelectItem></SelectContent></Select><p className="flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" />Moderadores operam o painel, mas não podem convidar nem alterar membros.</p><Button className="w-full" disabled={!email || busyId === "invite"} onClick={invite}>{busyId === "invite" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar convite</Button></div></DialogContent></Dialog>
  </div>;
};

export default AdminMembers;
