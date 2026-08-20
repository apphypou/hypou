import { useState } from "react";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ArrowRight, CheckCircle2, CircleDollarSign, FlaskConical, Handshake, Loader2, Search, Star, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const format = (value: number) => value.toLocaleString("pt-BR");
const percent = (value: number) => `${value}%`;

function MetricCard({ label, value, caption, icon: Icon, tone = "text-primary" }: { label: string; value: string; caption: string; icon: typeof Users; tone?: string }) {
  return <Card className="brand-card overflow-hidden"><CardContent className="flex items-start gap-4 p-5">
    <span className={`rounded-xl bg-background/70 p-3 ${tone}`}><Icon className="h-5 w-5" /></span>
    <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{caption}</p></div>
  </CardContent></Card>;
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold tracking-tight">{children}</h2>;
}

const AdminDashboard = () => {
  const [periodDays, setPeriodDays] = useState(30);
  const { data: stats, isLoading, error } = useAdminStats(periodDays);
  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !stats) return <div className="py-16 text-center text-muted-foreground">Não foi possível carregar as métricas. Atualize a página ou confirme sua permissão de administrador.</div>;

  const { kpis, validation, charts } = stats;
  const funnel = [
    ["Cadastros", validation.acquisition.signups],
    ["Primeiro item", validation.activation.firstItem],
    ["Primeira busca", validation.activation.firstSearch],
    ["Primeira negociação", validation.activation.firstTrade],
  ].filter(([, value]) => value as number > 0) as [string, number][];
  const maximumFunnel = Math.max(validation.acquisition.signups, 1);

  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-3xl font-bold tracking-tight">Visão geral</h1><p className="mt-1 text-sm text-muted-foreground">Acompanhe a validação do Hypou com dados reais.</p></div>
      <div className="flex items-center gap-2"><Select value={String(periodDays)} onValueChange={(value) => setPeriodDays(Number(value))}><SelectTrigger aria-label="Período das métricas" className="w-28 rounded-lg"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="90">90 dias</SelectItem></SelectContent></Select><span className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">Atualiza a cada 30 segundos</span></div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard label="Usuários cadastrados" value={format(kpis.totalUsers)} caption="Base total do aplicativo" icon={Users} />
      <MetricCard label="Ativação por item" value={percent(kpis.activationRate)} caption="Usuários com ao menos um item" icon={Activity} tone="text-pink" />
      <MetricCard label="Trocas concluídas" value={format(validation.liquidity.completedTrades)} caption={`${percent(kpis.completionRate)} das negociações resolvidas`} icon={Handshake} tone="text-brand-violet" />
      <MetricCard label="Avaliação média" value={kpis.averageRating ? kpis.averageRating.toFixed(1).replace(".", ",") : "—"} caption={validation.satisfaction.ratingsCount ? `${format(validation.satisfaction.ratingsCount)} avaliações` : "Ainda sem avaliações"} icon={Star} tone="text-amber-400" />
      <MetricCard label="Retenção D30" value={validation.retention.d30 === null ? "—" : percent(validation.retention.d30)} caption={validation.retention.configured ? "Coorte do 30º dia" : "Aguardando eventos de abertura"} icon={Activity} tone="text-brand-violet" />
      <MetricCard label="NPS" value={validation.satisfaction.nps === null ? "—" : String(validation.satisfaction.nps)} caption={validation.satisfaction.npsResponses ? `${format(validation.satisfaction.npsResponses)} respostas` : "Ainda sem respostas"} icon={Star} tone="text-pink" />
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr_.95fr]">
      <Card className="brand-card"><CardHeader><PanelTitle>Funil de ativação</PanelTitle><p className="text-xs text-muted-foreground">A jornada é preenchida à medida que o app envia eventos.</p></CardHeader><CardContent className="space-y-3">
        {funnel.length ? funnel.map(([label, value], index) => <div key={label}><div className="mb-1 flex justify-between text-xs"><span>{label}</span><span className="text-muted-foreground">{format(value)} · {percent(Math.round(value / maximumFunnel * 100))}</span></div><div className="h-8 rounded-lg bg-muted/70 p-1"><div className="h-full rounded-md brand-gradient" style={{ width: `${Math.max(8, value / maximumFunnel * 100)}%`, opacity: 1 - index * .12 }} /></div></div>) : <div className="py-12 text-center text-sm text-muted-foreground">Eventos de ativação ainda não foram recebidos.</div>}
        <Link to="/admin/metricas" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Ver definição das métricas <ArrowRight className="h-3.5 w-3.5" /></Link>
      </CardContent></Card>

      <Card className="brand-card"><CardHeader><PanelTitle>Cadastros</PanelTitle><p className="text-xs text-muted-foreground">Evolução diária, com dias sem novos cadastros incluídos.</p></CardHeader><CardContent><div className="h-[210px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={charts.usersByDay}><defs><linearGradient id="admin-users-gradient" x1="0" y1="0" x2="0" y2="1"><stop stopColor="hsl(var(--primary))" stopOpacity=".35" /><stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0" /></linearGradient></defs><XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} tickLine={false} axisLine={false} fontSize={10} /><YAxis allowDecimals={false} width={24} tickLine={false} axisLine={false} fontSize={10} /><Tooltip /><Area dataKey="count" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#admin-users-gradient)" /></AreaChart></ResponsiveContainer></div></CardContent></Card>

      <Card className="brand-card"><CardHeader><PanelTitle>Liquidez</PanelTitle><p className="text-xs text-muted-foreground">Itens e negociações no funil de troca.</p></CardHeader><CardContent className="space-y-4">
        {[["Itens publicados", validation.liquidity.itemsPublished, "text-primary"], ["Negociações abertas", validation.liquidity.tradesOpen, "text-brand-violet"], ["Trocas concluídas", validation.liquidity.completedTrades, "text-pink"]].map(([label, value, tone]) => <div key={label as string} className="flex items-center justify-between border-b border-border/70 pb-3 last:border-0 last:pb-0"><span className="text-sm text-muted-foreground">{label}</span><span className={`text-lg font-bold tabular-nums ${tone}`}>{format(value as number)}</span></div>)}
        <p className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">{percent(validation.liquidity.progressRate)} das negociações avançaram.</p>
      </CardContent></Card>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <Card className="brand-card"><CardHeader><PanelTitle>Negociações iniciadas</PanelTitle><p className="text-xs text-muted-foreground">Novas propostas por dia.</p></CardHeader><CardContent><div className="h-[190px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={charts.matchesByDay}><XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} tickLine={false} axisLine={false} fontSize={10} /><YAxis allowDecimals={false} width={24} tickLine={false} axisLine={false} fontSize={10} /><Tooltip /><Bar dataKey="count" fill="hsl(var(--brand-violet))" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
      <Card className="brand-card"><CardHeader><PanelTitle>Origem e liquidez</PanelTitle><p className="text-xs text-muted-foreground">Canais identificados e cidades com itens ativos.</p></CardHeader><CardContent className="space-y-3">
        {charts.acquisitionSources.length ? charts.acquisitionSources.slice(0, 3).map((source) => <p key={source.name} className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-primary" />{source.name}<span className="ml-auto font-semibold">{format(source.value)}</span></p>) : <p className="flex items-center gap-2 text-sm"><Search className="h-4 w-4 text-muted-foreground" />Origem de aquisição <span className="ml-auto text-xs text-muted-foreground">aguardando atribuição</span></p>}
        {charts.liquidityByCity.length ? charts.liquidityByCity.slice(0, 3).map((city) => <p key={city.name} className="flex items-center gap-2 text-sm"><FlaskConical className="h-4 w-4 text-brand-violet" />{city.name}<span className="ml-auto font-semibold">{format(city.value)} itens</span></p>) : <p className="text-sm text-muted-foreground">Ainda não há cidades suficientes para comparação.</p>}
        <p className="flex items-center gap-2 text-sm"><CircleDollarSign className="h-4 w-4 text-muted-foreground" />Receita, ARPU, MRR e LTV <span className="ml-auto text-xs text-muted-foreground">não configurados</span></p>
        <Link to="/admin/metricas" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Entender como configurar <ArrowRight className="h-3.5 w-3.5" /></Link>
      </CardContent></Card>
    </div>

    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      {kpis.pendingReports > 0 ? <Link to="/admin/reports" className="flex items-center justify-between rounded-xl border border-pink/30 bg-pink/5 px-4 py-3 text-sm"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-pink" />{format(kpis.pendingReports)} relatos aguardam análise</span><ArrowRight className="h-4 w-4 text-pink" /></Link> : <Card className="brand-card"><CardContent className="p-5 text-sm text-muted-foreground">Nenhum relato pendente no momento.</CardContent></Card>}
      <Card className="brand-card"><CardHeader><PanelTitle>Atividade recente</PanelTitle><p className="text-xs text-muted-foreground">Eventos de produto recebidos do aplicativo.</p></CardHeader><CardContent>{stats.activity.length ? <div className="space-y-2">{stats.activity.slice(0, 5).map((event, index) => <div key={`${event.name}-${event.occurredAt}-${index}`} className="flex items-center justify-between border-b border-border/70 pb-2 text-sm last:border-0 last:pb-0"><span className="capitalize">{event.name.replace(/_/g, " ")}</span><span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(event.occurredAt), { addSuffix: true, locale: ptBR })}</span></div>)}</div> : <p className="py-3 text-sm text-muted-foreground">A atividade aparecerá assim que a nova versão do app registrar eventos.</p>}</CardContent></Card>
    </div>
  </div>;
};

export default AdminDashboard;
