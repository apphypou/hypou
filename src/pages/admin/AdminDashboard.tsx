import { useState } from "react";
import type { ReactNode } from "react";
import { useAdminStats } from "@/hooks/useAdminStats";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Area, AreaChart, Cell, Funnel, FunnelChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ArrowRight, CheckCircle2, Download, Handshake, Info, Loader2, Search, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";

const format = (value: number) => value.toLocaleString("pt-BR");
const percent = (value: number) => `${value}%`;
const funnelColors = ["#18d5dc", "#20bfc8", "#a468f5", "#fa2b83"];
const chartTooltipStyle = { border: "1px solid #2a3941", borderRadius: "6px", background: "#0f181d", color: "#eaf1f3", fontSize: "11px" };

function PanelHeader({ title, description, filter }: { title: string; description: string; filter?: ReactNode }) {
  return <div className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-3.5"><div><h2 className="admin-dashboard-panel__heading flex items-center gap-1.5">{title}<Info className="h-3.5 w-3.5 text-muted-foreground" /></h2><p className="admin-dashboard-panel__description">{description}</p></div>{filter}</div>;
}

const AdminDashboard = () => {
  const [periodDays, setPeriodDays] = useState(30);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const isCustom = periodDays === 0;
  const { data: stats, isLoading, error } = useAdminStats(isCustom ? 30 : periodDays, isCustom && customStart && customEnd ? customStart : undefined, isCustom && customStart && customEnd ? customEnd : undefined);

  const exportReport = () => {
    if (!stats) return;
    const rows = [
      ["Métrica", "Valor"],
      ["Usuários ativos mensais", stats.validation.engagement.mau],
      ["Ativação por item", `${stats.kpis.activationRate}%`],
      ["Trocas em andamento", stats.validation.liquidity.tradesOpen],
      ["Trocas concluídas", stats.validation.liquidity.completedTrades],
      ["Retenção D30", stats.validation.retention.d30 === null ? "Ainda não medida" : `${stats.validation.retention.d30}%`],
      ["NPS", stats.validation.satisfaction.nps ?? "Ainda não medido"],
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "relatorio-hypou.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !stats) return <div className="py-16 text-center text-sm text-muted-foreground">Não foi possível carregar as métricas. Atualize a página ou confirme sua permissão de administrador.</div>;

  const { kpis, validation, charts } = stats;
  const funnel = [
    { name: "Criou conta", value: validation.acquisition.signups },
    { name: "Publicou item", value: validation.activation.firstItem },
    { name: "Iniciou troca", value: validation.activation.firstTrade },
    { name: "Concluiu troca", value: validation.liquidity.completedTrades },
  ];
  const funnelMaximum = Math.max(validation.acquisition.signups, 1);
  const rangeLabel = isCustom ? "Período personalizado" : `Últimos ${periodDays} dias`;
  const cityRows = charts.liquidityByCity.slice(0, 5);

  return <div className="space-y-3.5">
    <div className="admin-page-header flex flex-wrap items-end justify-between gap-3">
      <div><h1>Olá, equipe Hypou</h1><p className="mt-1">Aqui está o desempenho da plataforma no período selecionado.</p></div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Select value={String(periodDays)} onValueChange={(value) => setPeriodDays(Number(value))}><SelectTrigger aria-label="Período das métricas" className="admin-dashboard-filter w-[118px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="0">Personalizado</SelectItem></SelectContent></Select>
        {isCustom && <><input aria-label="Início do período" type="date" value={customStart} max={customEnd || undefined} onChange={(event) => setCustomStart(event.target.value)} className="admin-dashboard-filter" /><input aria-label="Fim do período" type="date" value={customEnd} min={customStart || undefined} onChange={(event) => setCustomEnd(event.target.value)} className="admin-dashboard-filter" /></>}
        <button type="button" onClick={exportReport} className="admin-export-button"><Download className="h-3.5 w-3.5" />Exportar relatório</button>
      </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <AdminMetricCard label="Usuários ativos" value={format(validation.engagement.mau)} description="Usuários ativos mensais, medidos por eventos de produto." icon={Users} tone="cyan" data={charts.usersByDay} />
      <AdminMetricCard label="Ativação" value={percent(kpis.activationRate)} description="Usuários que publicaram ao menos um item." icon={Activity} tone="neutral" data={charts.usersByDay} />
      <AdminMetricCard label="Trocas em andamento" value={format(validation.liquidity.tradesOpen)} description="Negociações abertas que ainda não foram concluídas ou canceladas." icon={Handshake} tone="violet" data={charts.matchesByDay} />
      <AdminMetricCard label="Trocas concluídas" value={format(validation.liquidity.completedTrades)} description="Permutas marcadas como concluídas." icon={CheckCircle2} tone="cyan" data={charts.matchesByDay} />
      <AdminMetricCard label="Retenção D30" value={validation.retention.d30 === null ? "—" : percent(validation.retention.d30)} description={validation.retention.configured ? "Coorte de retorno após 30 dias." : "Aguardando eventos de abertura do app."} icon={Activity} tone="pink" />
      <AdminMetricCard label="NPS" value={validation.satisfaction.nps === null ? "—" : String(validation.satisfaction.nps)} description={validation.satisfaction.npsResponses ? `${format(validation.satisfaction.npsResponses)} respostas recebidas.` : "Ainda não há respostas de NPS."} icon={Star} tone="violet" />
    </div>

    <div className="grid gap-3 xl:grid-cols-[1.03fr_1fr_1.06fr]">
      <Card className="admin-panel overflow-hidden">
        <PanelHeader title="Funil de ativação" description="Da criação de conta à troca concluída." filter={<span className="admin-dashboard-filter">{rangeLabel}</span>} />
        <CardContent className="grid min-h-[284px] grid-cols-[.9fr_1.1fr] gap-2 p-4"><ResponsiveContainer width="100%" height="100%"><FunnelChart><Tooltip contentStyle={chartTooltipStyle} /><Funnel dataKey="value" data={funnel} isAnimationActive={false}>{funnel.map((step, index) => <Cell key={step.name} fill={funnelColors[index]} />)}</Funnel></FunnelChart></ResponsiveContainer><div className="space-y-2.5 py-2">{funnel.map((step) => <div key={step.name} className="border-b border-dashed border-border pb-2 last:border-0"><div className="flex justify-between gap-2 text-[11px]"><span className="text-foreground">{step.name}</span><strong className="text-right text-foreground">{format(step.value)}</strong></div><p className="mt-0.5 text-[10px] text-muted-foreground">{percent(Math.round(step.value / funnelMaximum * 100))}</p></div>)}</div></CardContent>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs"><span className="text-muted-foreground">Conversão total</span><span className="font-semibold text-foreground">{percent(Math.round(validation.liquidity.completedTrades / funnelMaximum * 100))}</span></div>
      </Card>

      <Card className="admin-panel overflow-hidden">
        <PanelHeader title="Registros de usuários" description="Novos registros ao longo do tempo." filter={<span className="admin-dashboard-filter">{rangeLabel}</span>} />
        <CardContent className="p-4 pb-2"><div className="h-[205px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={charts.usersByDay} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}><defs><linearGradient id="admin-users-gradient" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#18d5dc" stopOpacity=".22" /><stop offset="1" stopColor="#18d5dc" stopOpacity="0" /></linearGradient></defs><XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} tickLine={false} axisLine={false} fontSize={10} stroke="#71808a" /><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} stroke="#71808a" /><Tooltip contentStyle={chartTooltipStyle} /><Area dataKey="count" type="monotone" stroke="#18d5dc" strokeWidth={2} fill="url(#admin-users-gradient)" isAnimationActive={false} /></AreaChart></ResponsiveContainer></div></CardContent>
        <div className="grid grid-cols-2 border-t border-border text-xs"><div className="p-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total de registros</p><strong className="mt-1 block text-base">{format(validation.acquisition.signups)}</strong></div><div className="border-l border-border p-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Média diária</p><strong className="mt-1 block text-base">{format(Math.round(validation.acquisition.signups / Math.max(stats.meta.periodDays, 1)))}</strong></div></div>
      </Card>

      <Card className="admin-panel overflow-hidden">
        <PanelHeader title="Liquidez por cidade" description="Itens ativos nas cidades com maior oferta." filter={<span className="admin-dashboard-filter">{rangeLabel}</span>} />
        <CardContent className="p-0">{cityRows.length ? <table className="w-full text-xs"><thead><tr><th className="px-4 text-left">Cidade</th><th className="px-4 text-right">Itens ativos</th></tr></thead><tbody>{cityRows.map((city) => <tr key={city.name}><td className="px-4 py-3">{city.name}</td><td className="px-4 py-3 text-right font-semibold text-primary">{format(city.value)}</td></tr>)}</tbody></table> : <div className="flex h-[230px] flex-col items-center justify-center gap-2 px-6 text-center"><Search className="h-5 w-5 text-muted-foreground" /><p className="text-xs text-muted-foreground">Ainda não há cidades suficientes para comparação.</p></div>}</CardContent>
        <Link to="/admin/metricas" className="flex items-center justify-between border-t border-border px-4 py-3 text-xs font-semibold text-primary hover:bg-primary/5"><span>Ver métricas detalhadas</span><ArrowRight className="h-3.5 w-3.5" /></Link>
      </Card>
    </div>

    <Card className="admin-panel overflow-hidden">
      <PanelHeader title="Alertas operacionais" description="Sinais que precisam de acompanhamento da equipe." />
      <CardContent className="p-0">{kpis.pendingReports > 0 ? <table className="w-full text-xs"><thead><tr><th className="px-4 text-left">Severidade</th><th className="px-4 text-left">Alerta</th><th className="px-4 text-left">Descrição</th><th className="px-4 text-right">Ocorrências</th><th className="px-4 text-right">Status</th></tr></thead><tbody><tr><td className="px-4 py-3"><span className="font-semibold text-pink">Alta</span></td><td className="px-4 py-3 font-semibold">Relatos aguardando análise</td><td className="px-4 py-3 text-muted-foreground">Existem relatos enviados por usuários que aguardam uma decisão da moderação.</td><td className="px-4 py-3 text-right">{format(kpis.pendingReports)}</td><td className="px-4 py-3 text-right"><span className="rounded border border-pink/50 px-2 py-1 text-[10px] font-semibold text-pink">Novo</span></td></tr></tbody></table> : <div className="flex items-center justify-between gap-4 px-4 py-5 text-xs"><span className="text-muted-foreground">Nenhum alerta operacional aberto no momento.</span><Link to="/admin/reports" className="font-semibold text-primary hover:underline">Abrir moderação</Link></div>}</CardContent>
      <div className="flex justify-between border-t border-border px-4 py-3 text-xs"><Link to="/admin/reports" className="font-semibold text-primary hover:underline">Ver todos os alertas</Link><Link to="/admin/status" className="font-semibold text-primary hover:underline">Ver status da plataforma</Link></div>
    </Card>
  </div>;
};

export default AdminDashboard;
