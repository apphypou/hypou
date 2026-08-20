import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ShieldOff, ShieldX, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";

const PAGE_SIZE = 20;

type AdminUser = { id: string; user_id: string; display_name: string | null; avatar_url: string | null; location: string | null; subscription_tier: string; onboarding_completed: boolean; created_at: string };

const AdminUsuarios = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const { toast } = useToast();
  const client = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: async () => {
      let query = supabase.from("profiles").select("id,user_id,display_name,avatar_url,location,subscription_tier,onboarding_completed,created_at", { count: "exact" }).order("created_at", { ascending: false });
      const term = search.trim();
      if (term) query = query.or(`display_name.ilike.%${term}%,location.ilike.%${term}%`);
      const { data: rows, count, error } = await query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      const ids = (rows || []).map((row) => row.user_id);
      const { data: suspensions, error: suspensionError } = ids.length ? await supabase.from("user_suspensions").select("user_id,reason,suspended_at").in("user_id", ids).is("lifted_at", null) : { data: [], error: null };
      if (suspensionError) throw suspensionError;
      return { users: (rows || []) as AdminUser[], total: count || 0, suspended: new Map((suspensions || []).map((entry) => [entry.user_id, entry])) };
    },
  });

  const { data: detail } = useQuery({
    queryKey: ["admin-user-detail", selected?.user_id],
    enabled: !!selected,
    queryFn: async () => {
      const id = selected!.user_id;
      const [{ data: items, error: itemError }, { data: matches, error: matchError }, { data: suspension, error: suspensionError }] = await Promise.all([
        supabase.from("items").select("id,name,status,market_value,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(10),
        supabase.from("matches").select("id,status,created_at,cash_amount_cents").or(`user_a_id.eq.${id},user_b_id.eq.${id}`).order("created_at", { ascending: false }).limit(10),
        supabase.from("user_suspensions").select("reason,suspended_at").eq("user_id", id).is("lifted_at", null).maybeSingle(),
      ]);
      if (itemError || matchError || suspensionError) throw itemError || matchError || suspensionError;
      return { items: items || [], matches: matches || [], suspension };
    },
  });

  const suspensionMutation = useMutation({
    mutationFn: async ({ userId, suspended, reason }: { userId: string; suspended: boolean; reason: string }) => {
      const { error } = await supabase.rpc("admin_set_user_suspension", { p_user_id: userId, p_suspended: suspended, p_reason: reason });
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      await Promise.all([client.invalidateQueries({ queryKey: ["admin-users"] }), client.invalidateQueries({ queryKey: ["admin-user-detail", variables.userId] })]);
      toast({ title: variables.suspended ? "Usuário suspenso" : "Acesso reativado" });
    },
    onError: (error) => toast({ title: "Não foi possível alterar o acesso", description: getErrorMessage(error), variant: "destructive" }),
  });

  const setSuspension = (user: AdminUser, suspended: boolean) => {
    const reason = suspended ? window.prompt("Motivo da suspensão (visível na auditoria):") : "Reativação administrativa";
    if (!reason?.trim()) return;
    suspensionMutation.mutate({ userId: user.user_id, suspended, reason: reason.trim() });
  };

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));
  const users = data?.users || [];

  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><div className="rounded-lg bg-primary/10 p-2"><Users className="h-5 w-5 text-primary" /></div><h1 className="text-2xl font-bold">Usuários</h1><Badge variant="secondary" className="rounded-full">{data?.total || 0}</Badge></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar nome ou cidade..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} className="h-9 rounded-xl pl-9" /></div></div><Card className="brand-card overflow-hidden"><CardContent className="p-0">{isLoading ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : users.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</div> : <Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Localização</TableHead><TableHead>Plano</TableHead><TableHead>Status</TableHead><TableHead>Cadastro</TableHead></TableRow></TableHeader><TableBody>{users.map((user) => { const suspension = data?.suspended.get(user.user_id); return <TableRow key={user.id} className="cursor-pointer" onClick={() => setSelected(user)}><TableCell><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={user.avatar_url || ""} /><AvatarFallback>{(user.display_name || "?")[0].toUpperCase()}</AvatarFallback></Avatar><span className="font-medium">{user.display_name || "Sem nome"}</span></div></TableCell><TableCell>{user.location || "—"}</TableCell><TableCell><Badge variant="outline">{user.subscription_tier}</Badge></TableCell><TableCell>{suspension ? <Badge variant="destructive">Suspenso</Badge> : <Badge variant={user.onboarding_completed ? "default" : "secondary"}>{user.onboarding_completed ? "Ativo" : "Onboarding"}</Badge>}</TableCell><TableCell className="text-muted-foreground">{formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ptBR })}</TableCell></TableRow>; })}</TableBody></Table>}</CardContent></Card><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Página {page + 1} de {totalPages}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</Button></div></div><Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{selected?.display_name || "Usuário"}</DialogTitle></DialogHeader>{selected && <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-4"><div><p className="text-sm text-muted-foreground">{selected.location || "Localização não informada"}</p><p className="mt-1 text-xs text-muted-foreground">Plano {selected.subscription_tier}</p></div>{detail?.suspension ? <Button variant="outline" disabled={suspensionMutation.isPending} onClick={() => setSuspension(selected, false)}><ShieldOff className="mr-2 h-4 w-4" />Reativar acesso</Button> : <Button variant="destructive" disabled={suspensionMutation.isPending} onClick={() => setSuspension(selected, true)}><ShieldX className="mr-2 h-4 w-4" />Suspender</Button>}</div>{detail?.suspension && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Suspenso: {detail.suspension.reason}</p>}<div className="grid gap-4 md:grid-cols-2"><div><h2 className="mb-2 text-sm font-semibold">Itens recentes</h2><div className="space-y-2">{detail?.items.length ? detail.items.map((item) => <div key={item.id} className="rounded-lg border border-border p-3 text-sm"><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.status} · R$ {(item.market_value / 100).toFixed(2)}</p></div>) : <p className="text-sm text-muted-foreground">Sem itens.</p>}</div></div><div><h2 className="mb-2 text-sm font-semibold">Negociações recentes</h2><div className="space-y-2">{detail?.matches.length ? detail.matches.map((match) => <div key={match.id} className="rounded-lg border border-border p-3 text-sm"><p className="font-medium capitalize">{match.status}</p><p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(match.created_at), { addSuffix: true, locale: ptBR })}</p></div>) : <p className="text-sm text-muted-foreground">Sem negociações.</p>}</div></div></div></div>}</DialogContent></Dialog></div>;
};

export default AdminUsuarios;
