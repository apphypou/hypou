import { Capacitor } from "@capacitor/core";

export interface CallRuntimeDiagnostics {
  kind: "audio" | "video";
  platform: string;
  native: boolean;
  origin: string;
  protocol: string;
  secureContext: boolean;
  userAgent: string;
  mediaDevices: boolean;
  getUserMedia: boolean;
  enumerateDevices: boolean;
  rtcPeerConnection: boolean;
  webSocket: boolean;
  mediaStream: boolean;
}

export interface SafeCallRouteState {
  hasToken: boolean;
  urlHost: string | null;
  callSessionId: string | null;
  conversationId: string | null;
  kind: "audio" | "video" | null;
  isCaller: boolean | null;
}

export function getCallRuntimeDiagnostics(
  kind: "audio" | "video",
  win: Pick<Window, "location" | "navigator" | "isSecureContext"> = window,
): CallRuntimeDiagnostics {
  const nav = win.navigator as Navigator & {
    mediaDevices?: Pick<MediaDevices, "getUserMedia" | "enumerateDevices">;
  };

  return {
    kind,
    platform: Capacitor.getPlatform(),
    native: Capacitor.isNativePlatform(),
    origin: win.location.origin,
    protocol: win.location.protocol,
    secureContext: !!win.isSecureContext,
    userAgent: nav.userAgent,
    mediaDevices: !!nav.mediaDevices,
    getUserMedia: typeof nav.mediaDevices?.getUserMedia === "function",
    enumerateDevices: typeof nav.mediaDevices?.enumerateDevices === "function",
    rtcPeerConnection: typeof globalThis.RTCPeerConnection === "function",
    webSocket: typeof globalThis.WebSocket === "function",
    mediaStream: typeof globalThis.MediaStream === "function",
  };
}

export function redactCallRouteState(state: Partial<{
  token: string;
  url: string;
  callSessionId: string;
  conversationId: string;
  kind: "audio" | "video";
  isCaller: boolean;
}> | null | undefined): SafeCallRouteState {
  let urlHost: string | null = null;
  if (state?.url) {
    try {
      urlHost = new URL(state.url).host;
    } catch {
      urlHost = "invalid-url";
    }
  }

  return {
    hasToken: !!state?.token,
    urlHost,
    callSessionId: state?.callSessionId ?? null,
    conversationId: state?.conversationId ?? null,
    kind: state?.kind ?? null,
    isCaller: typeof state?.isCaller === "boolean" ? state.isCaller : null,
  };
}

export function describeCallError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const record = error as Record<string, unknown>;
  const cause = record.cause && typeof record.cause === "object"
    ? {
        name: (record.cause as Record<string, unknown>).name,
        message: (record.cause as Record<string, unknown>).message,
      }
    : record.cause;

  return {
    name: record.name,
    message: record.message,
    code: record.code,
    reason: record.reason,
    kind: record.kind,
    cause,
  };
}

export async function preflightCallMedia(
  kind: "audio" | "video",
  mediaDevices: Pick<MediaDevices, "getUserMedia"> | undefined = navigator.mediaDevices,
) {
  if (!mediaDevices || typeof mediaDevices.getUserMedia !== "function") {
    throw new Error("Câmera/microfone não disponíveis neste dispositivo.");
  }

  const constraints: MediaStreamConstraints = kind === "video"
    ? { audio: true, video: { facingMode: "user" } }
    : { audio: true };

  const stream = await mediaDevices.getUserMedia(constraints);
  const summary = {
    audioTracks: stream.getAudioTracks().length,
    videoTracks: stream.getVideoTracks().length,
  };
  stream.getTracks().forEach((track) => track.stop());
  return summary;
}
