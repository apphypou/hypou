import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

type Level = "info" | "warn" | "error";
type SafeValue = string | number | boolean | null | undefined;
type SafeData = Record<string, SafeValue>;

export type EdgeObservation = {
  traceId: string;
  functionName: string;
  startedAt: number;
  userId?: string;
};

const SENSITIVE_KEY = /token|secret|password|authorization|cookie|email|phone|name|description|message|content|body|url/i;

const safeMetadata = (data?: SafeData) => Object.fromEntries(
  Object.entries(data ?? {})
    .filter(([key, value]) => !SENSITIVE_KEY.test(key) && value !== undefined)
    .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 180) : value]),
);

const errorCode = (error: unknown) => {
  if (error && typeof error === "object") {
    const source = error as { name?: unknown; code?: unknown };
    if (typeof source.code === "string") return source.code.slice(0, 80);
    if (typeof source.name === "string") return source.name.slice(0, 80);
  }
  return "UNKNOWN_ERROR";
};

export const createEdgeObservation = (req: Request, functionName: string): EdgeObservation => {
  const suppliedTraceId = req.headers.get("x-hypou-trace-id");
  const traceId = suppliedTraceId && /^[A-Za-z0-9-]{8,120}$/.test(suppliedTraceId)
    ? suppliedTraceId
    : `${functionName}-${crypto.randomUUID()}`;
  return { traceId, functionName, startedAt: Date.now() };
};

export const edgeLog = (
  observation: EdgeObservation,
  level: Level,
  event: string,
  data?: SafeData,
) => {
  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](JSON.stringify({
    traceId: observation.traceId,
    source: "edge",
    level,
    event,
    functionName: observation.functionName,
    durationMs: Date.now() - observation.startedAt,
    ...safeMetadata(data),
  }));
};

export const persistEdgeObservation = async (
  admin: SupabaseClient,
  observation: EdgeObservation,
  level: Exclude<Level, "info">,
  event: string,
  options: { action: string; httpStatus?: number; error?: unknown; metadata?: SafeData },
) => {
  const { error } = await admin.from("observability_events").insert({
    trace_id: observation.traceId,
    source: "edge",
    level,
    event,
    action: options.action,
    function_name: observation.functionName,
    user_id: observation.userId ?? null,
    platform: "edge",
    duration_ms: Date.now() - observation.startedAt,
    http_status: options.httpStatus,
    error_code: options.error ? errorCode(options.error) : undefined,
    metadata: safeMetadata(options.metadata),
  });
  if (error) edgeLog(observation, "warn", "observability.persist_failed", { code: error.code });
};
