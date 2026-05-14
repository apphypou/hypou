import { supabase } from "@/integrations/supabase/client";

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
  const { data, error } = await supabase.functions.invoke("livekit-token", {
    body: { action: "start", conversation_id: conversationId, kind },
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as CallTokenResponse;
}

export async function joinCall(callSessionId: string): Promise<CallTokenResponse> {
  const { data, error } = await supabase.functions.invoke("livekit-token", {
    body: { action: "join", call_session_id: callSessionId },
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as CallTokenResponse;
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
