import { useDeferredValue, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ListOrdered, Download, Search, ChevronLeft, ChevronRight, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportAdminWaitlist, getAdminWaitlistPage } from "@/services/adminWaitlistService";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 25;

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

const AdminWaitlist = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-waitlist", page, deferredSearch],
    queryFn: () => getAdminWaitlistPage(page, deferredSearch),
  });

  useEffect(() => setPage(1), [deferredSearch]);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const entries = await exportAdminWaitlist(deferredSearch);
      const header = "posicao,email,referral_code,referred_by,data,convertido_em\n";
      const rows = entries.map((entry) => [entry.position, entry.email, entry.referral_code, entry.referred_by, entry.created_at, entry.converted_at].map(csvCell).join(",")).join("\n");
      const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "waitlist.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      toast({ title: "Não foi possível exportar a Waitlist", description: exportError instanceof Error ? exportError.message : undefined, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const entries = data?.entries || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));
  const conversionRate = data?.total ? Math.round((data.convertedCount / data.total) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-orange-500/10 p-2"><ListOrdered className="h-5 w-5 text-orange-500" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">Waitlist</h1><p className="text-xs text-muted-foreground">Leads que aguardam o lançamento.</p></div>
          <Badge variant="secondary" className="ml-1 rounded-full">{data?.total || 0}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar e-mail ou código..." value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 rounded-xl border-border/50 pl-9" /></div>
          <Button variant="outline" size="sm" disabled={exporting} onClick={exportCSV} className="rounded-xl"><Download className="mr-2 h-4 w-4" />{exporting ? "Exportando..." : "CSV"}</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="brand-card"><CardContent className="flex items-center gap-3 p-4"><ListOrdered className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Leads na Waitlist</p><p className="text-lg font-bold tabular-nums">{data?.total || 0}</p></div></CardContent></Card>
        <Card className="brand-card"><CardContent className="flex items-center gap-3 p-4"><UserCheck className="h-5 w-5 text-brand-violet" /><div><p className="text-xs text-muted-foreground">Conversão em cadastro</p><p className="text-lg font-bold tabular-nums">{conversionRate === null ? "—" : `${conversionRate}%`} <span className="text-xs font-normal text-muted-foreground">{data?.convertedCount || 0} convertidos</span></p></div></CardContent></Card>
      </div>

      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-0">
          {isLoading ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : error ? <div className="py-16 text-center text-sm text-muted-foreground">Não foi possível carregar a Waitlist. Tente novamente.</div> : entries.length === 0 ? <div className="py-16 text-center"><ListOrdered className="mx-auto mb-3 h-12 w-12 text-muted-foreground/20" /><p className="text-sm text-muted-foreground">Nenhum registro encontrado</p></div> : <Table>
            <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30"><TableHead>#</TableHead><TableHead>E-mail</TableHead><TableHead className="hidden md:table-cell">Código referral</TableHead><TableHead className="hidden lg:table-cell">Indicado por</TableHead><TableHead>Conversão</TableHead><TableHead className="hidden sm:table-cell">Cadastro</TableHead></TableRow></TableHeader>
            <TableBody>{entries.map((entry) => <TableRow key={entry.id}><TableCell className="font-bold tabular-nums">{entry.position}</TableCell><TableCell className="font-medium text-sm">{entry.email}</TableCell><TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{entry.referral_code}</TableCell><TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{entry.referred_by || "—"}</TableCell><TableCell>{entry.converted_at ? <Badge className="rounded-full">Convertido</Badge> : <Badge variant="secondary" className="rounded-full">Aguardando</Badge>}</TableCell><TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ptBR })}</TableCell></TableRow>)}</TableBody>
          </Table>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Página {page} de {totalPages}{isFetching && " · Atualizando"}</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1 || isFetching}><ChevronLeft className="mr-1 h-4 w-4" />Anterior</Button><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages || isFetching}>Próxima<ChevronRight className="ml-1 h-4 w-4" /></Button></div></div>
    </div>
  );
};

export default AdminWaitlist;
