import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminReports = () => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Reports / Moderação</h1>
        <Badge variant="secondary" className="ml-2">{reports?.length || 0}</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {(reports?.length || 0) === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum report encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reportado</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reports || []).map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge variant="destructive">{report.reason}</Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate text-muted-foreground">
                      {report.description || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{report.reporter_id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{report.reported_user_id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ptBR })}
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

export default AdminReports;
