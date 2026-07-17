export type TradeStatus = "proposal" | "accepted" | "completed" | "cancelled" | "rejected";

export type TradeBadge = {
  label: string;
  detail: string;
  tone: "new" | "accepted" | "pending" | "sent" | "completed" | "cancelled";
};

type TradeStatusInput = {
  status: TradeStatus | string;
  cancellationReason?: string | null;
  isSentProposal?: boolean;
  createdAt?: string;
};

export const getTradeBadge = ({
  status,
  cancellationReason,
  isSentProposal = false,
  createdAt,
}: TradeStatusInput): TradeBadge | null => {
  if (status === "completed") {
    return { label: "Concluída", detail: "Troca concluída", tone: "completed" };
  }

  if (status === "rejected") {
    return { label: "Recusada", detail: "A proposta foi recusada", tone: "cancelled" };
  }

  if (status === "cancelled") {
    if (cancellationReason === "withdrawn_before_delivery") {
      return { label: "Desistência", detail: "Negociação cancelada antes da entrega", tone: "cancelled" };
    }
    if (cancellationReason === "withdrawn_proposal") {
      return { label: "Cancelada", detail: "Proposta cancelada por quem a enviou", tone: "cancelled" };
    }
    return { label: "Cancelada", detail: "Negociação encerrada", tone: "cancelled" };
  }

  if (status === "accepted") {
    return { label: "Em negociação", detail: "Aguardando a confirmação da troca", tone: "accepted" };
  }
  if (isSentProposal) {
    return { label: "Enviada", detail: "Aguardando resposta", tone: "sent" };
  }

  const isRecent = createdAt && Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
  return isRecent
    ? { label: "Nova proposta", detail: "Proposta recebida", tone: "new" }
    : { label: "Pendente", detail: "Proposta aguardando resposta", tone: "pending" };
};
