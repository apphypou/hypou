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
import { Loader2, MailPlus, ShieldCheck, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Member = { user_id: string; role: "admin" | "moderator"; profile: { display_name: string | null; avatar_url: string | null; created_at: string } | null };

const AdminMembers = () => {
  const client = useQueryClient(); const { toast } = useToast();
  const [open, setOpen] = useState(false); const [email, setEmail] = useState(""); const [role, setRole] = useState<"admin" | "moderator">("moderator"); const [busy, setBusy] = useState(false);
  const { data: members = [], isLoading } = useQuery({ queryKey: ["admin-members"], queryFn: async () => { const { data, error } = await supabase.functions.invoke("admin-members", { body: { action: "list" } }); if (error) throw error; return (data.members || []) as Member[]; } });
  const invite = async () => { setBusy(true); const { error } = await supabase.functions.invoke("admin-members", { body: { action: "invite", email, role } }); setBusy(false); if (error) { toast({ title: "Não foi possível enviar o convite.", variant: "destructive" }); return; } setEmail(""); setOpen(false); client.invalidateQueries({ queryKey: ["admin-members"] }); toast({ title: "Convite enviado", description: "A pessoa receberá um e-mail para ativar o acesso ao painel." }); };
  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-bold tracking-tight">Membros do painel</h1><p className="mt-1 text-sm text-muted-foreground">Acesso exclusivo para administradores e moderadores.</p></div><Button className="rounded-xl" onClick={() => setOpen(true)}><MailPlus className="mr-2 h-4 w-4" />Convidar membro</Button></div><Card className="brand-card"><CardContent className="p-0">{members.length ? <div className="divide-y divide-border">{members.map((member) => <div key={member.user_id} className="flex items-center gap-3 p-4"><Avatar><AvatarImage src={member.profile?.avatar_url || ""} /><AvatarFallback>{(member.profile?.display_name || "A")[0]}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="font-medium">{member.profile?.display_name || "Membro convidado"}</p><p className="text-xs text-muted-foreground">ID {member.user_id.slice(0, 8)}…</p></div><Badge variant={member.role === "admin" ? "default" : "secondary"} className="rounded-full">{member.role === "admin" ? "Administrador" : "Moderador"}</Badge></div>)}</div> : <div className="py-16 text-center text-sm text-muted-foreground"><Users className="mx-auto mb-3 h-10 w-10 opacity-30" />Nenhum membro adicional encontrado.</div>}</CardContent></Card><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Convidar membro</DialogTitle></DialogHeader><div className="space-y-4"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@empresa.com" /><Select value={role} onValueChange={(value) => setRole(value as "admin" | "moderator")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="moderator">Moderador</SelectItem><SelectItem value="admin">Administrador</SelectItem></SelectContent></Select><p className="flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" />Moderadores não podem conceder acesso. Administradores também podem gerenciar membros.</p><Button className="w-full" disabled={!email || busy} onClick={invite}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar convite</Button></div></DialogContent></Dialog></div>;
};

export default AdminMembers;
