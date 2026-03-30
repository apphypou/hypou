import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Package, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminItens = () => {
  const [search, setSearch] = useState("");
  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = (items || []).filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <Package className="h-5 w-5 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Itens</h1>
          <Badge variant="secondary" className="ml-1 rounded-full">{items?.length || 0}</Badge>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl border-border/50"
          />
        </div>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Nome</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Categoria</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Valor</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Condição</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Criado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="transition-colors duration-150">
                    <TableCell className="font-medium text-sm">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full text-[11px]">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      R$ {(item.market_value / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.status === "active" ? "default" : "secondary"}
                        className="rounded-full text-[11px]"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.condition || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminItens;
