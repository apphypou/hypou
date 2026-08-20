import { useAdminStats } from "@/hooks/useAdminStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const number = (value: number | null) => value === null ? "Não configurado" : value.toLocaleString("pt-BR");
const percent = (value: number | null) => value === null ? "Aguardando dados" : `${value}%`;

const AdminMetrics = () => {
  const { data: stats, isLoading, error } = useAdminStats();
  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !stats) return <div className="py-16 text-center text-muted-foreground">Não foi possível carregar as métricas.</div>;
  const { validation } = stats;
  const sections = [
    ["Aquisição", [["Usuários cadastrados", number(validation.acquisition.signups), "Perfis criados no aplicativo."], ["Origem identificada", number(validation.acquisition.attributedUsers), "Exige atribuição na criação da conta."], ["CPA", validation.acquisition.cpaCents === null ? "Não configurado" : `R$ ${(validation.acquisition.cpaCents / 100).toFixed(2)}`, "Exige o lançamento de investimento por canal."]]],
    ["Ativação", [["Primeiro item", number(validation.activation.firstItem), "Usuários que publicaram pelo menos um item."], ["Primeira busca", number(validation.activation.firstSearch), "Exige o evento search_performed no app."], ["Primeira negociação", number(validation.activation.firstTrade), "Participantes de uma negociação."]]],
    ["Engajamento", [["WAU", number(validation.engagement.wau), "Usuários ativos nos últimos 7 dias."], ["MAU", number(validation.engagement.mau), "Usuários ativos nos últimos 30 dias."], ["Interações registradas", number(validation.engagement.interactions), "Eventos de produto recebidos nos últimos 90 dias."]]],
    ["Liquidez", [["Itens publicados", number(validation.liquidity.itemsPublished), "Itens ativos disponíveis."], ["Negociações que avançaram", number(validation.liquidity.tradesProgressed), "Propostas aceitas ou concluídas."], ["Permutas concluídas", number(validation.liquidity.completedTrades), "Trocas finalizadas."]]],
    ["Retenção", [["D7", percent(validation.retention.d7), "Será calculada por coorte quando houver eventos de abertura."], ["D30", percent(validation.retention.d30), "Será calculada por coorte quando houver eventos de abertura."], ["D90", percent(validation.retention.d90), "Será calculada por coorte quando houver eventos de abertura."]]],
    ["Satisfação", [["Avaliação média", validation.satisfaction.averageRating?.toFixed(1).replace(".", ",") || "Sem avaliações", "Média das avaliações pós-troca."], ["NPS", validation.satisfaction.nps === null ? "Sem respostas" : String(validation.satisfaction.nps), "Promotores menos detratores."], ["Respostas NPS", number(validation.satisfaction.npsResponses), "Respostas recebidas nos últimos 90 dias."]]],
    ["Monetização", [["Planos pagos", number(validation.monetization.paidUsers), "Ainda sem integração de billing."], ["ARPU", validation.monetization.arpuCents === null ? "Não configurado" : `R$ ${(validation.monetization.arpuCents / 100).toFixed(2)}`, "Receita média por usuário."], ["MRR e LTV", "Não configurados", "Entram quando a fonte de receita for conectada."]]],
  ] as const;

  return <div className="space-y-7"><div><h1 className="text-3xl font-bold tracking-tight">Métricas de validação</h1><p className="mt-1 text-sm text-muted-foreground">Cada indicador mostra sua origem; nenhum número é estimado ou preenchido artificialmente.</p></div><div className="grid gap-5 lg:grid-cols-2">{sections.map(([title, rows]) => <Card key={title} className="brand-card"><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="space-y-3">{rows.map(([label, value, description]) => <div key={label} className="border-b border-border/70 pb-3 last:border-0 last:pb-0"><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><p className="text-sm font-medium">{label}</p><p className="text-sm font-bold tabular-nums text-primary">{value}</p></div><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>)}</CardContent></Card>)}</div></div>;
};

export default AdminMetrics;
