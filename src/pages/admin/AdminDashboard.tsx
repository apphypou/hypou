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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(40, 80%, 55%)",
  "hsl(340, 65%, 50%)",
  "hsl(270, 55%, 55%)",
  "hsl(190, 65%, 45%)",
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Usuários" value={kpis.totalUsers} icon={Users} />
        <KpiCard title="Itens Ativos" value={kpis.activeItems} icon={Package} />
        <KpiCard title="Matches Hoje" value={kpis.matchesToday} icon={Handshake} description={`${kpis.totalMatches} total`} />
        <KpiCard title="Swipes Hoje" value={kpis.swipesToday} icon={Zap} />
        <KpiCard title="Mensagens Total" value={kpis.totalMessages} icon={MessageSquare} />
        <KpiCard title="Taxa Aceitação" value={`${kpis.acceptanceRate}%`} icon={TrendingUp} />
        <KpiCard title="Reports" value={kpis.pendingReports} icon={ShieldAlert} />
        <KpiCard title="Waitlist" value={kpis.waitlistCount} icon={ListOrdered} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cadastros (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Cadastros", color: "hsl(var(--primary))" } }} className="h-[200px]">
              <AreaChart data={charts.usersByDay}>
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} className="text-[10px]" />
                <YAxis width={30} className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="count" fill="hsl(var(--primary))" fillOpacity={0.2} stroke="hsl(var(--primary))" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Matches by day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Matches (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Matches", color: "hsl(var(--primary))" } }} className="h-[200px]">
              <BarChart data={charts.matchesByDay}>
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} className="text-[10px]" />
                <YAxis width={30} className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Items by category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Itens por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-[200px] w-full max-w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.itemsByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {charts.itemsByCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Waitlist growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Crescimento Waitlist (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Inscritos", color: "hsl(var(--primary))" } }} className="h-[200px]">
              <AreaChart data={charts.waitlistByDay}>
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} className="text-[10px]" />
                <YAxis width={30} className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="count" fill="hsl(var(--primary))" fillOpacity={0.15} stroke="hsl(var(--primary))" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Realtime Feed */}
      <RealtimeActivityFeed />
    </div>
  );
};

export default AdminDashboard;
