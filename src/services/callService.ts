import { supabase } from "@/integrations/supabase/client";
import { createTraceId, logError, logInfo } from "@/lib/observability";

export type CallKind = "video" | "audio";

export interface CallTokenResponse {
  token: string;
  url: string;
  room_name: string;
  call_session_id: string;
  kind: CallKind;
  caller_id: string;
  callee_id: string;
  conversation_id: string;
}

export async function startCall(conversationId: string, kind: CallKind): Promise<CallTokenResponse> {
  return invokeCallToken({ action: "start", conversation_id: conversationId, kind }, "call_start");
}

export async function joinCall(callSessionId: string): Promise<CallTokenResponse> {
  return invokeCallToken({ action: "join", call_session_id: callSessionId }, "call_join");
}

async function invokeCallToken(body: Record<string, string>, action: "call_start" | "call_join"): Promise<CallTokenResponse> {
  const traceId = createTraceId("call");
  const startedAt = performance.now();
  logInfo("call.token_started", action, traceId);
  try {
    const { data, error } = await supabase.functions.invoke("livekit-token", {
      body,
      headers: { "x-hypou-trace-id": traceId },
    });
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
    logInfo("call.token_completed", action, traceId, { durationMs: Math.round(performance.now() - startedAt) });
    return data as CallTokenResponse;
  } catch (error) {
    logError("call.token_failed", action, traceId, error, { durationMs: Math.round(performance.now() - startedAt) });
    throw error;
  }
}

export async function acceptCall(callSessionId: string) {
  const { error } = await supabase
    .from("call_sessions")
    .update({ status: "accepted" })
    .eq("id", callSessionId);
  if (error) throw error;
}

export async function declineCall(callSessionId: string) {
  const { error } = await supabase
    .from("call_sessions")
    .update({ status: "declined" })
    .eq("id", callSessionId);
  if (error) throw error;
}

export async function endCall(callSessionId: string) {
  const { error } = await supabase
    .from("call_sessions")
    .update({ status: "ended" })
    .eq("id", callSessionId);
  if (error) throw error;
}

export async function markMissed(callSessionId: string) {
  const { error } = await supabase
    .from("call_sessions")
    .update({ status: "missed" })
    .eq("id", callSessionId);
  if (error) throw error;
}
