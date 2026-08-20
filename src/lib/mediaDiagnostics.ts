const STORAGE_KEY = "hypou.media-diagnostics.v1";
const MAX_EVENTS = 120;

type DiagnosticValue = string | number | boolean | null | undefined;
type DiagnosticData = Record<string, DiagnosticValue>;

type MediaDiagnosticEvent = {
  at: string;
  event: string;
  traceId?: string;
  data?: DiagnosticData;
};

const safeError = (error: unknown): DiagnosticData => {
  if (error instanceof Error) {
    const source = error as Error & { code?: string; status?: number; details?: string; hint?: string };
    return {
      errorName: source.name,
      errorMessage: source.message,
      errorCode: source.code,
      errorStatus: source.status,
      errorDetails: source.details,
      errorHint: source.hint,
    };
  }

  if (error && typeof error === "object") {
    const source = error as { message?: unknown; code?: unknown; status?: unknown; details?: unknown; hint?: unknown };
    return {
      errorMessage: typeof source.message === "string" ? source.message : "Erro desconhecido",
      errorCode: typeof source.code === "string" ? source.code : undefined,
      errorStatus: typeof source.status === "number" ? source.status : undefined,
      errorDetails: typeof source.details === "string" ? source.details : undefined,
      errorHint: typeof source.hint === "string" ? source.hint : undefined,
    };
  }

  return { errorMessage: String(error ?? "Erro desconhecido") };
};

const readEvents = (): MediaDiagnosticEvent[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Lightweight media trace for native debugging. It records metadata only: no
 * media URLs, file contents, tokens, or full user identifiers are persisted.
 */
export const logMediaDiagnostic = (
  event: string,
  data?: DiagnosticData,
  traceId?: string,
) => {
  const entry: MediaDiagnosticEvent = {
    at: new Date().toISOString(),
    event,
    traceId,
    data,
  };

  console.info("[HypouMedia]", entry);

  if (typeof window === "undefined") return;
  try {
    const events = [...readEvents(), entry].slice(-MAX_EVENTS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (storageError) {
    console.warn("[HypouMedia] Não foi possível persistir o diagnóstico", storageError);
  }
};

export const logMediaError = (
  event: string,
  error: unknown,
  data?: DiagnosticData,
  traceId?: string,
) => {
  const resolvedTraceId = traceId ?? createTraceId("media");
  logMediaDiagnostic(event, { ...data, ...safeError(error) }, resolvedTraceId);
  logError(event, "media", resolvedTraceId, error, data);
};

export const createMediaTraceId = () => `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const getMediaDiagnostics = (): MediaDiagnosticEvent[] => readEvents();

export const describeMediaFile = (file: File): DiagnosticData => ({
  mediaName: file.name.replace(/[^.]+(?=\.)/, "media"),
  mediaType: file.type || "unknown",
  mediaSizeBytes: file.size,
});
import { createTraceId, logError } from "@/lib/observability";
