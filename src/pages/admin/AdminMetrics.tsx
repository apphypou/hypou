import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminStats } from "@/hooks/useAdminStats";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const number = (value: number | null) => value === null ? "Não configurado" : value.toLocaleString("pt-BR");
const percent = (value: number | null) => value === null ? "Aguardando dados" : `${value}%`;

const AdminMetrics = () => {
  const [periodDays, setPeriodDays] = useState(30);
  const [spendOpen, setSpendOpen] = useState(false);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const client = useQueryClient();
  const { data: stats, isLoading, error } = useAdminStats(periodDays);

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !stats) return <div className="py-16 text-center text-muted-foreground">Não foi possível carregar as métricas.</div>;

  const { validation } = stats;
  const sections = [
    ["Aquisição", [["Usuários cadastrados", number(validation.acquisition.signups), "Perfis criados no aplicativo."], ["Origem identificada", number(validation.acquisition.attributedUsers), "Cadastros com canal de aquisição salvo."], ["CPA", validation.acquisition.cpaCents === null ? "Não configurado" : `R$ ${(validation.acquisition.cpaCents / 100).toFixed(2)}`, "Investimento do período dividido por cadastros totais."]]],
    ["Ativação", [["Primeiro item", number(validation.activation.firstItem), "Usuários que publicaram pelo menos um item."], ["Primeira busca", number(validation.activation.firstSearch), "Busca enviada pelo aplicativo."], ["Primeira negociação", number(validation.activation.firstTrade), "Participantes de uma negociação."]]],
    ["Engajamento", [["WAU", number(validation.engagement.wau), "Usuários ativos nos últimos 7 dias."], ["MAU", number(validation.engagement.mau), "Usuários ativos nos últimos 30 dias."], ["Interações registradas", number(validation.engagement.interactions), "Eventos de produto no período medido."]]],
    ["Liquidez", [["Itens publicados", number(validation.liquidity.itemsPublished), "Itens ativos disponíveis."], ["Negociações que avançaram", number(validation.liquidity.tradesProgressed), "Propostas aceitas ou concluídas."], ["Permutas concluídas", number(validation.liquidity.completedTrades), "Trocas finalizadas."]]],
    ["Retenção", [["D7", percent(validation.retention.d7), "Coorte de usuários que voltaram exatamente no 7º dia."], ["D30", percent(validation.retention.d30), "Coorte de usuários que voltaram exatamente no 30º dia."], ["D90", percent(validation.retention.d90), "Coorte de usuários que voltaram exatamente no 90º dia."]]],
    ["Satisfação", [["Avaliação média", validation.satisfaction.averageRating?.toFixed(1).replace(".", ",") || "Sem avaliações", "Média das avaliações pós-troca."], ["NPS", validation.satisfaction.nps === null ? "Sem respostas" : String(validation.satisfaction.nps), "Promotores menos detratores."], ["Respostas NPS", number(validation.satisfaction.npsResponses), "Respostas recebidas nos últimos 90 dias."]]],
    ["Monetização", [["Planos pagos", number(validation.monetization.paidUsers), "Ainda sem integração de billing."], ["ARPU", validation.monetization.arpuCents === null ? "Não configurado" : `R$ ${(validation.monetization.arpuCents / 100).toFixed(2)}`, "Receita média por usuário."], ["MRR e LTV", "Não configurados", "Entram quando a fonte de receita for conectada."]]],
  ] as const;

  const saveSpend = async () => {
    const amountCents = Math.round(Number(amount.replace(",", ".")) * 100);
    if (!source.trim() || !Number.isFinite(amountCents) || amountCents <= 0) {
      toast({ title: "Informe canal e valor válidos", variant: "destructive" });
      return;
    }
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const { error: insertError } = await supabase.from("marketing_spend").insert({ source: source.trim(), amount_cents: amountCents, period_start: today, period_end: today });
    setSaving(false);
    if (insertError) {
      toast({ title: "Não foi possível registrar o investimento", description: insertError.message, variant: "destructive" });
      return;
    }
    setSpendOpen(false);
    setSource("");
    setAmount("");
    await client.invalidateQueries({ queryKey: ["admin-stats"] });
    toast({ title: "Investimento registrado" });
  };

  return <div className="space-y-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-bold tracking-tight">Métricas de validação</h1><p className="mt-1 text-sm text-muted-foreground">Cada indicador explicita a origem; ausência de dado não é mostrada como zero.</p></div><div className="flex gap-2"><Select value={String(periodDays)} onValueChange={(value) => setPeriodDays(Number(value))}><SelectTrigger aria-label="Período das métricas" className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="90">90 dias</SelectItem></SelectContent></Select><Button onClick={() => setSpendOpen(true)}><Plus className="mr-2 h-4 w-4" />Registrar investimento</Button></div></div><div className="grid gap-5 lg:grid-cols-2">{sections.map(([title, rows]) => <Card key={title} className="brand-card"><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="space-y-3">{rows.map(([label, value, description]) => <div key={label} className="border-b border-border/70 pb-3 last:border-0 last:pb-0"><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><p className="text-sm font-medium">{label}</p><p className="text-sm font-bold tabular-nums text-primary">{value}</p></div><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>)}</CardContent></Card>)}</div><Dialog open={spendOpen} onOpenChange={setSpendOpen}><DialogContent><DialogHeader><DialogTitle>Registrar investimento</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="spend-source">Canal</Label><Input id="spend-source" value={source} onChange={(event) => setSource(event.target.value)} placeholder="Meta Ads, influenciador, evento..." /></div><div className="space-y-2"><Label htmlFor="spend-amount">Valor em R$</Label><Input id="spend-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="150,00" /></div><Button className="w-full" disabled={saving} onClick={saveSpend}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar investimento</Button></div></DialogContent></Dialog></div>;
};

export default AdminMetrics;
