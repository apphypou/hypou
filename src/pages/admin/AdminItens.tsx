import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EyeOff, Loader2, Package, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";

const PAGE_SIZE = 20;
type AdminItem = { id: string; user_id: string; name: string; category: string; condition: string | null; status: string; market_value: number; location: string | null; description: string | null; created_at: string };

const AdminItens = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AdminItem | null>(null);
  const client = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["admin-items", search, page], queryFn: async () => {
    let query = supabase.from("items").select("id,user_id,name,category,condition,status,market_value,location,description,created_at", { count: "exact" }).order("created_at", { ascending: false });
    const term = search.trim();
    if (term) query = query.or(`name.ilike.%${term}%,category.ilike.%${term}%,location.ilike.%${term}%`);
    const { data: items, count, error } = await query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (error) throw error;
    return { items: (items || []) as AdminItem[], total: count || 0 };
  } });
  const { data: detail } = useQuery({ queryKey: ["admin-item-detail", selected?.id], enabled: !!selected, queryFn: async () => {
    const [{ data: item, error: itemError }, { data: images, error: imageError }, { data: matches, error: matchError }] = await Promise.all([
      supabase.from("items").select("*").eq("id", selected!.id).single(),
      supabase.from("item_images").select("id,image_url,position").eq("item_id", selected!.id).order("position"),
      supabase.from("matches").select("id,status,created_at").or(`item_a_id.eq.${selected!.id},item_b_id.eq.${selected!.id}`).order("created_at", { ascending: false }).limit(10),
    ]);
    if (itemError || imageError || matchError) throw itemError || imageError || matchError;
    return { item, images: images || [], matches: matches || [] };
  } });
  const statusMutation = useMutation({ mutationFn: async ({ id, status }: { id: string; status: string }) => {
    const { error } = await supabase.from("items").update({ status }).eq("id", id);
    if (error) throw error;
  }, onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ["admin-items"] }), client.invalidateQueries({ queryKey: ["admin-item-detail"] })]); toast({ title: "Status do item atualizado" }); }, onError: (error) => toast({ title: "Não foi possível atualizar o item", description: getErrorMessage(error), variant: "destructive" }) });
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><div className="rounded-lg bg-primary/10 p-2"><Package className="h-5 w-5 text-primary" /></div><h1 className="text-2xl font-bold">Itens</h1><Badge variant="secondary" className="rounded-full">{data?.total || 0}</Badge></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar item, categoria ou cidade..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} className="h-9 rounded-xl pl-9" /></div></div><Card className="brand-card overflow-hidden"><CardContent className="p-0">{isLoading ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : !data?.items.length ? <div className="py-16 text-center text-sm text-muted-foreground">Nenhum item encontrado.</div> : <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Categoria</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead>Local</TableHead></TableRow></TableHeader><TableBody>{data.items.map((item) => <TableRow key={item.id} onClick={() => setSelected(item)} className="cursor-pointer"><TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.category}</TableCell><TableCell>R$ {(item.market_value / 100).toFixed(2)}</TableCell><TableCell><Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status}</Badge></TableCell><TableCell className="text-muted-foreground">{item.location || "—"}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Página {page + 1} de {totalPages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Anterior</Button><Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</Button></div></div><Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>{selected && <div className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">{selected.category} · {selected.condition || "Condição não informada"}</p><p className="mt-1 text-lg font-semibold">R$ {(selected.market_value / 100).toFixed(2)}</p></div><Button variant={selected.status === "active" ? "destructive" : "default"} disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: selected.id, status: selected.status === "active" ? "inactive" : "active" })}><EyeOff className="mr-2 h-4 w-4" />{selected.status === "active" ? "Desativar item" : "Reativar item"}</Button></div><p className="rounded-xl bg-muted/40 p-4 text-sm">{selected.description || "Sem descrição."}</p><div><h2 className="mb-2 text-sm font-semibold">Fotos</h2><div className="flex flex-wrap gap-3">{detail?.images.length ? detail.images.map((image) => <img key={image.id} src={image.image_url} alt="Item" className="h-24 w-24 rounded-lg object-cover" />) : <p className="text-sm text-muted-foreground">Sem fotos.</p>}</div></div><div><h2 className="mb-2 text-sm font-semibold">Histórico de negociações</h2>{detail?.matches.length ? <div className="space-y-2">{detail.matches.map((match) => <div key={match.id} className="rounded-lg border border-border p-3 text-sm"><Badge variant="outline">{match.status}</Badge></div>)}</div> : <p className="text-sm text-muted-foreground">Nenhuma negociação.</p>}</div></div>}</DialogContent></Dialog></div>;
};

export default AdminItens;
