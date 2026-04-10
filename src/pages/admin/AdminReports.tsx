import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { blockUser } from "@/services/reportService";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldAlert, Search, CheckCircle2, XCircle, Ban } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const AdminReports = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleResolve = async (reportId: string, newStatus: "resolved" | "dismissed") => {
    setResolving(true);
    try {
      const { error } = await supabase
        .from("reports")
        .update({
          status: newStatus,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes || null,
        })
        .eq("id", reportId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast({ title: newStatus === "resolved" ? "Report resolvido ✅" : "Report descartado" });
      setSelectedReport(null);
      setResolutionNotes("");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setResolving(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!user) return;
    try {
      await blockUser(user.id, userId);
      toast({ title: "Usuário bloqueado 🚫", description: "Este usuário não aparecerá mais para você." });
    } catch (err: any) {
      toast({ title: "Erro ao bloquear", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = (reports || []).filter((r) => {
    const matchesSearch =
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || (r as any).status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    pending: (reports || []).filter((r) => (r as any).status === "pending" || !(r as any).status).length,
    resolved: (reports || []).filter((r) => (r as any).status === "resolved").length,
    dismissed: (reports || []).filter((r) => (r as any).status === "dismissed").length,
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-full text-[11px]">Resolvido</Badge>;
      case "dismissed":
        return <Badge className="bg-foreground/10 text-foreground/50 border-foreground/20 rounded-full text-[11px]">Descartado</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 rounded-full text-[11px]">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-red-500/10 p-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Reports / Moderação</h1>
          <Badge variant="secondary" className="ml-1 rounded-full">{reports?.length || 0}</Badge>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar report..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl border-border/50"
          />
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        {[
          { value: "all", label: "Todos", count: reports?.length || 0 },
          { value: "pending", label: "Pendentes", count: statusCounts.pending },
          { value: "resolved", label: "Resolvidos", count: statusCounts.resolved },
          { value: "dismissed", label: "Descartados", count: statusCounts.dismissed },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum report encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Motivo</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Descrição</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Reporter</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Reportado</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Data</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((report) => (
                  <TableRow key={report.id} className="transition-colors duration-150">
                    <TableCell>{getStatusBadge((report as any).status)}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="rounded-full text-[11px]">{report.reason}</Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate text-muted-foreground">
                      {report.description || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{report.reporter_id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{report.reported_user_id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {((report as any).status === "pending" || !(report as any).status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs rounded-lg"
                          onClick={() => setSelectedReport(report)}
                        >
                          Resolver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resolve Report Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => { setSelectedReport(null); setResolutionNotes(""); }}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">Resolver Report</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                <p className="text-xs text-muted-foreground">Motivo: <strong className="text-foreground">{selectedReport.reason}</strong></p>
                <p className="text-xs text-muted-foreground">Descrição: {selectedReport.description || "Nenhuma"}</p>
                <p className="text-xs text-muted-foreground">Reportado: <span className="font-mono">{selectedReport.reported_user_id.slice(0, 12)}...</span></p>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Notas de resolução (opcional)
                </label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Descreva a ação tomada..."
                  rows={3}
                  className="bg-background border-border/50"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleResolve(selectedReport.id, "dismissed")}
                  disabled={resolving}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Descartar
                </Button>
                <Button
                  onClick={() => handleResolve(selectedReport.id, "resolved")}
                  disabled={resolving}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700"
                >
                  {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                  Resolver
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
