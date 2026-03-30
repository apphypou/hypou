import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminUsuarios = () => {
  const [search, setSearch] = useState("");
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
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

  const filtered = (users || []).filter(
    (u) =>
      (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.location || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <Badge variant="secondary" className="ml-1 rounded-full">{users?.length || 0}</Badge>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário..."
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
              <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Nome</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Localização</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Plano</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Onboarding</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id} className="transition-colors duration-150">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 ring-2 ring-border">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {(user.display_name || "?")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.display_name || "Sem nome"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.location || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.subscription_tier === "free" ? "outline" : "default"} className="rounded-full text-[11px]">
                        {user.subscription_tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.onboarding_completed ? "default" : "secondary"}
                        className="rounded-full text-[11px]"
                      >
                        {user.onboarding_completed ? "Completo" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ptBR })}
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

export default AdminUsuarios;
