import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FlaskConical, Loader2, Search, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const csvField = (value: string) => `"${value.replace(/"/g, '""')}"`;

const AdminBetaTesters = () => {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { data: testers = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-beta-testers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beta_testers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => testers.filter((tester) => {
    const haystack = `${tester.first_name} ${tester.last_name} ${tester.email}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  }), [search, testers]);

  const selected = testers.filter((tester) => selectedIds.includes(tester.id));

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((currentId) => currentId !== id) : [...current, id]);
  };

  const exportSelected = () => {
    if (!selected.length) {
      toast({ title: "Selecione pelo menos um testador." });
      return;
    }

    const csv = ["First Name,Last Name,Email", ...selected.map((tester) => [tester.first_name, tester.last_name, tester.email].map(csvField).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hypou-testflight-testers.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const markAsInvited = async () => {
    if (!selected.length) return;
    const { error } = await supabase
      .from("beta_testers")
      .update({ invited_at: new Date().toISOString() })
      .in("id", selected.map((tester) => tester.id));
    if (error) {
      toast({ title: "Não foi possível atualizar os convites.", variant: "destructive" });
      return;
    }
    setSelectedIds([]);
    await refetch();
    toast({ title: "Testadores marcados como convidados." });
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2"><FlaskConical className="h-5 w-5 text-primary" /></div>
          <h1 className="text-2xl font-bold text-foreground">Testadores beta</h1>
          <Badge variant="secondary" className="rounded-full">{testers.length}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome ou e-mail" className="h-9 rounded-xl pl-9" />
          </div>
          <Button variant="outline" size="sm" onClick={exportSelected} disabled={!selected.length} className="rounded-xl">
            <Download className="mr-2 h-4 w-4" />Exportar CSV
          </Button>
          <Button size="sm" onClick={markAsInvited} disabled={!selected.length} className="rounded-xl">
            <Send className="mr-2 h-4 w-4" />Marcar convidados
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-0">
          {!filtered.length ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Nenhum testador encontrado.</div>
          ) : (
            <Table>
              <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-12" />
                <TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Status</TableHead><TableHead>Cadastro</TableHead>
              </TableRow></TableHeader>
              <TableBody>{filtered.map((tester) => (
                <TableRow key={tester.id}>
                  <TableCell><input aria-label={`Selecionar ${tester.email}`} type="checkbox" checked={selectedIds.includes(tester.id)} onChange={() => toggleSelected(tester.id)} /></TableCell>
                  <TableCell className="font-medium">{tester.first_name} {tester.last_name}</TableCell>
                  <TableCell>{tester.email}</TableCell>
                  <TableCell><Badge variant={tester.invited_at ? "default" : "secondary"}>{tester.invited_at ? "Convidado" : "Pendente"}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{new Date(tester.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBetaTesters;
