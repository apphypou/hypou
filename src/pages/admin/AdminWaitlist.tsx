import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ListOrdered, Download, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminWaitlist = () => {
  const [search, setSearch] = useState("");
  const { data: entries, isLoading } = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const exportCSV = () => {
    if (!entries?.length) return;
    const header = "posicao,email,referral_code,referred_by,data\n";
    const rows = entries
      .map((e) => `${e.position},${e.email},${e.referral_code},${e.referred_by || ""},${e.created_at}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waitlist.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = (entries || []).filter(
    (e) =>
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.referral_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-orange-500/10 p-2">
            <ListOrdered className="h-5 w-5 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Waitlist</h1>
          <Badge variant="secondary" className="ml-1 rounded-full">{entries?.length || 0}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl border-border/50"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <ListOrdered className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">#</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Email</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Código Referral</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Indicado por</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id} className="transition-colors duration-150">
                    <TableCell className="font-bold tabular-nums">{entry.position}</TableCell>
                    <TableCell className="font-medium text-sm">{entry.email}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{entry.referral_code}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{entry.referred_by || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ptBR })}
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

export default AdminWaitlist;
