import { describe, expect, it } from "vitest";
import { getTradeBadge } from "@/lib/tradeStatus";

describe("trade status presentation", () => {
  it("distinguishes a rejected proposal from a withdrawal", () => {
    expect(getTradeBadge({ status: "rejected" })).toMatchObject({
      label: "Recusada",
      detail: "A proposta foi recusada",
    });
    expect(getTradeBadge({ status: "cancelled", cancellationReason: "withdrawn_before_delivery" })).toMatchObject({
      label: "Desistência",
      detail: "Negociação cancelada antes da entrega",
    });
  });

  it("does not infer a cancellation reason for legacy matches", () => {
    expect(getTradeBadge({ status: "cancelled" })).toMatchObject({
      label: "Cancelada",
      detail: "Negociação encerrada",
    });
  });
});
