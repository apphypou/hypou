import type { Message } from "@/services/messageService";

export type MessageDeliveryStatus = "none" | "sending" | "sent" | "delivered" | "read" | "failed";

export const getMessageDeliveryStatus = (
  message: Pick<Message, "sender_id" | "read_at"> & {
    failed?: boolean | null;
    delivered_at?: string | null;
    local_status?: MessageDeliveryStatus | null;
  },
  currentUserId?: string
): MessageDeliveryStatus => {
  if (!currentUserId || message.sender_id !== currentUserId) return "none";
  if (message.failed || message.local_status === "failed") return "failed";
  if (message.local_status === "sending") return "sending";
  if (message.read_at) return "read";
  if (message.delivered_at) return "delivered";
  return "sent";
};

export const getMessageDeliveryLabel = (status: MessageDeliveryStatus) => {
  if (status === "failed") return "Falhou";
  if (status === "sending") return "Enviando";
  if (status === "read") return "Lida";
  if (status === "delivered") return "Entregue";
  if (status === "sent") return "Enviada";
  return "";
};
