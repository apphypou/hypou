import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Centraliza os canais Realtime do app para que possamos reconectar todos
 * de uma vez quando o app volta de background, perde conexão ou troca de
 * estado. Cada hook continua usando supabase.channel diretamente, mas registra
 * o canal aqui para participar da reconexão.
 */
const channels = new Set<RealtimeChannel>();
let lastReconnect = 0;

export function trackChannel(channel: RealtimeChannel) {
  channels.add(channel);
  return () => {
    channels.delete(channel);
    try {
      supabase.removeChannel(channel);
    } catch {
      /* noop */
    }
  };
}

/**
 * Força reconexão de todo o transporte Realtime. Debounced em 2s para evitar
 * tempestades quando vários eventos (focus + online + appStateChange) chegam
 * próximos.
 */
export function forceReconnect() {
  const now = Date.now();
  if (now - lastReconnect < 2000) return;
  lastReconnect = now;
  try {
    // Reinicia a conexão WebSocket: o cliente reassina automaticamente
    // todos os canais já registrados via supabase.channel().
    supabase.realtime.disconnect();
    supabase.realtime.connect();
  } catch {
    /* noop */
  }
}

export function getActiveChannelCount() {
  return channels.size;
}
