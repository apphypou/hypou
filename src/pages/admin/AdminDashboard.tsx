import { useAdminStats } from "@/hooks/useAdminStats";
import { KpiCard } from "@/components/admin/KpiCard";
import { RealtimeActivityFeed } from "@/components/admin/RealtimeActivityFeed";
import {
  Users,
  Package,
  Handshake,
  MessageSquare,
  Zap,
  ShieldAlert,
  ListOrdered,
  TrendingUp,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(210, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(40, 80%, 55%)",
  "hsl(340, 65%, 50%)",
  "hsl(270, 55%, 55%)",
  "hsl(190, 65%, 45%)",
  "hsl(20, 70%, 50%)",
];

const AdminDashboard = () => {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Erro ao carregar estatísticas. Verifique se você tem permissão de admin.
      </div>
    );
  }

  const { kpis, charts } = stats;
  const totalItemsByCategory = charts.itemsByCategory.reduce((sum: number, c: { value: number }) => sum + c.value, 0);

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do sistema em tempo real</p>
      </div>

      {/* KPIs */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Métricas</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Total Usuários" value={kpis.totalUsers} icon={Users} colorClass="bg-blue-500/10 text-blue-500" />
          <KpiCard title="Itens Ativos" value={kpis.activeItems} icon={Package} colorClass="bg-emerald-500/10 text-emerald-500" />
          <KpiCard title="Matches Hoje" value={kpis.matchesToday} icon={Handshake} description={`${kpis.totalMatches} total`} colorClass="bg-amber-500/10 text-amber-500" />
          <KpiCard title="Swipes Hoje" value={kpis.swipesToday} icon={Zap} colorClass="bg-violet-500/10 text-violet-500" />
          <KpiCard title="Mensagens Total" value={kpis.totalMessages} icon={MessageSquare} colorClass="bg-purple-500/10 text-purple-500" />
          <KpiCard title="Taxa Aceitação" value={`${kpis.acceptanceRate}%`} icon={TrendingUp} colorClass="bg-teal-500/10 text-teal-500" />
          <KpiCard title="Reports" value={kpis.pendingReports} icon={ShieldAlert} colorClass="bg-red-500/10 text-red-500" />
          <KpiCard title="Waitlist" value={kpis.waitlistCount} icon={ListOrdered} colorClass="bg-orange-500/10 text-orange-500" />
        </div>
      </div>

      {/* Charts */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Gráficos</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by day */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Cadastros
                </CardTitle>
                <Badge variant="outline" className="text-[10px] rounded-full">30 dias</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: "Cadastros", color: "hsl(210, 70%, 55%)" } }} className="h-[200px]">
                <AreaChart data={charts.usersByDay}>
                  <defs>
                    <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(210, 70%, 55%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(210, 70%, 55%)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} className="text-[10px]" />
                  <YAxis width={30} className="text-[10px]" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="count" fill="url(#gradUsers)" stroke="hsl(210, 70%, 55%)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Matches by day */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Handshake className="h-4 w-4 text-amber-500" />
                  Matches
                </CardTitle>
                <Badge variant="outline" className="text-[10px] rounded-full">30 dias</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: "Matches", color: "hsl(40, 80%, 55%)" } }} className="h-[200px]">
                <BarChart data={charts.matchesByDay}>
                  <defs>
                    <linearGradient id="gradMatches" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(40, 80%, 55%)" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="hsl(40, 80%, 55%)" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} className="text-[10px]" />
                  <YAxis width={30} className="text-[10px]" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="url(#gradMatches)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Items by category - Donut */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-emerald-500" />
                  Itens por Categoria
                </CardTitle>
                <Badge variant="outline" className="text-[10px] rounded-full">{totalItemsByCategory} itens</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-[220px] w-full max-w-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.itemsByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={50}
                      paddingAngle={3}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {charts.itemsByCategory.map((_: unknown, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Central label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground tabular-nums">{totalItemsByCategory}</p>
                    <p className="text-[10px] text-muted-foreground">total</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Waitlist growth */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 text-orange-500" />
                  Crescimento Waitlist
                </CardTitle>
                <Badge variant="outline" className="text-[10px] rounded-full">30 dias</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: "Inscritos", color: "hsl(20, 70%, 50%)" } }} className="h-[200px]">
                <AreaChart data={charts.waitlistByDay}>
                  <defs>
                    <linearGradient id="gradWaitlist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(20, 70%, 50%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(20, 70%, 50%)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} className="text-[10px]" />
                  <YAxis width={30} className="text-[10px]" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="count" fill="url(#gradWaitlist)" stroke="hsl(20, 70%, 50%)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Realtime Feed */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tempo Real</h2>
        </div>
        <RealtimeActivityFeed />
      </div>
    </div>
  );
};

export default AdminDashboard;
