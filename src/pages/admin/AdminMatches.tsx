import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Handshake, Loader2, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const PAGE_SIZE = 20;
type AdminMatch = { id: string; status: string; user_a_id: string; user_b_id: string; item_a_id: string; item_b_id: string; cash_amount_cents: number | null; cancellation_reason: string | null; created_at: string; updated_at: string };

const AdminMatches = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AdminMatch | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["admin-matches", search, page], queryFn: async () => {
    let query = supabase.from("matches").select("id,status,user_a_id,user_b_id,item_a_id,item_b_id,cash_amount_cents,cancellation_reason,created_at,updated_at", { count: "exact" }).order("created_at", { ascending: false });
    if (search.trim()) query = query.eq("status", search.trim());
    const { data: matches, count, error } = await query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (error) throw error;
    return { matches: (matches || []) as AdminMatch[], total: count || 0 };
  } });
  const { data: detail } = useQuery({ queryKey: ["admin-match-detail", selected?.id], enabled: !!selected, queryFn: async () => {
    const match = selected!;
    const [{ data: items, error: itemsError }, { data: profiles, error: profilesError }, { data: messages, error: messagesError }] = await Promise.all([
      supabase.from("match_items").select("side,item:item_id(id,name,market_value,category)").eq("match_id", match.id),
      supabase.from("profiles").select("user_id,display_name,avatar_url,location").in("user_id", [match.user_a_id, match.user_b_id]),
      supabase.from("conversations").select("id,messages(id,content,message_type,created_at,sender_id)").eq("match_id", match.id).maybeSingle(),
    ]);
    if (itemsError || profilesError || messagesError) throw itemsError || profilesError || messagesError;
    return { items: items || [], profiles: profiles || [], messages: (messages as any)?.messages || [] };
  } });
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><div className="rounded-lg bg-primary/10 p-2"><Handshake className="h-5 w-5 text-primary" /></div><h1 className="text-2xl font-bold">Negociações</h1><Badge variant="secondary" className="rounded-full">{data?.total || 0}</Badge></div><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Filtrar por status..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} className="h-9 rounded-xl pl-9" /></div></div><Card className="brand-card overflow-hidden"><CardContent className="p-0">{isLoading ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : !data?.matches.length ? <div className="py-16 text-center text-sm text-muted-foreground">Nenhuma negociação encontrada.</div> : <Table><TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Complemento</TableHead><TableHead>Motivo de cancelamento</TableHead><TableHead>Criada</TableHead></TableRow></TableHeader><TableBody>{data.matches.map((match) => <TableRow key={match.id} className="cursor-pointer" onClick={() => setSelected(match)}><TableCell><Badge variant={match.status === "completed" ? "default" : "secondary"}>{match.status}</Badge></TableCell><TableCell>{match.cash_amount_cents ? `R$ ${(match.cash_amount_cents / 100).toFixed(2)}` : "—"}</TableCell><TableCell className="max-w-[260px] truncate">{match.cancellation_reason || "—"}</TableCell><TableCell className="text-muted-foreground">{formatDistanceToNow(new Date(match.created_at), { addSuffix: true, locale: ptBR })}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Página {page + 1} de {totalPages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Anterior</Button><Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</Button></div></div><Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Detalhes da negociação</DialogTitle></DialogHeader>{selected && <div className="space-y-5"><div className="flex flex-wrap gap-3"><Badge>{selected.status}</Badge>{selected.cash_amount_cents ? <Badge variant="outline">Complemento: R$ {(selected.cash_amount_cents / 100).toFixed(2)}</Badge> : null}</div>{selected.cancellation_reason && <p className="rounded-lg bg-muted p-3 text-sm">Cancelamento: {selected.cancellation_reason}</p>}<div className="grid gap-4 md:grid-cols-2"><div><h2 className="mb-2 text-sm font-semibold">Participantes</h2>{detail?.profiles.map((profile) => <div key={profile.user_id} className="rounded-lg border border-border p-3 text-sm"><p className="font-medium">{profile.display_name || "Sem nome"}</p><p className="text-xs text-muted-foreground">{profile.location || "Local não informado"}</p></div>)}</div><div><h2 className="mb-2 text-sm font-semibold">Itens envolvidos</h2>{detail?.items.map((entry: any, index) => <div key={index} className="rounded-lg border border-border p-3 text-sm"><p className="font-medium">{entry.item?.name || "Item indisponível"}</p><p className="text-xs text-muted-foreground">Lado {entry.side === "a" ? "proponente" : "recebedor"}</p></div>)}</div></div><div><h2 className="mb-2 text-sm font-semibold">Timeline de mensagens</h2>{detail?.messages.length ? <div className="max-h-48 space-y-2 overflow-auto">{detail.messages.map((message: any) => <div key={message.id} className="rounded-lg bg-muted/50 p-3 text-sm"><p>{message.content}</p><p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: ptBR })}</p></div>)}</div> : <p className="text-sm text-muted-foreground">Nenhuma mensagem disponível.</p>}</div></div>}</DialogContent></Dialog></div>;
};

export default AdminMatches;
