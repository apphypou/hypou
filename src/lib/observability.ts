import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

type LogLevel = "info" | "warn" | "error";
type SafeValue = string | number | boolean | null | undefined;
type PersistedValue = Exclude<SafeValue, undefined>;
export type ObservabilityData = Record<string, SafeValue>;

type ObservabilityEvent = {
  traceId: string;
  source: "client";
  level: LogLevel;
  event: string;
  action: string;
  screen?: string;
  durationMs?: number;
  httpStatus?: number;
  errorCode?: string;
  metadata?: ObservabilityData;
};

const SENSITIVE_KEY = /token|secret|password|authorization|cookie|email|phone|name|description|message|content|body|url/i;
const MAX_METADATA_VALUE_LENGTH = 180;

const currentScreen = () => typeof window === "undefined" ? undefined : window.location.pathname;

const scrubText = (value: string) => value
  .replace(/https?:\/\/\S+/gi, "[url]")
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
  .replace(/bearer\s+\S+/gi, "Bearer [redacted]")
  .slice(0, MAX_METADATA_VALUE_LENGTH);

export const sanitizeObservabilityData = (data?: ObservabilityData): Record<string, PersistedValue> => {
  if (!data) return {};

  return Object.fromEntries(
    Object.entries(data)
      .filter(([key, value]) => !SENSITIVE_KEY.test(key) && value !== undefined)
      .map(([key, value]) => [key, typeof value === "string" ? scrubText(value) : value as PersistedValue]),
  ) as Record<string, PersistedValue>;
};

export const createTraceId = (scope: string) => {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${scope}-${id}`.slice(0, 120);
};

const describeError = (error: unknown): Pick<ObservabilityEvent, "errorCode" | "httpStatus"> => {
  if (!error || typeof error !== "object") return { errorCode: "UNKNOWN_ERROR" };
  const source = error as { code?: unknown; status?: unknown; name?: unknown };
  return {
    errorCode: typeof source.code === "string" ? source.code.slice(0, 80) : typeof source.name === "string" ? source.name.slice(0, 80) : "UNKNOWN_ERROR",
    httpStatus: typeof source.status === "number" ? source.status : undefined,
  };
};

const persist = async (entry: ObservabilityEvent) => {
  if (entry.level === "info") return;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;

    await supabase.from("observability_events").insert({
      trace_id: entry.traceId,
      source: entry.source,
      level: entry.level,
      event: entry.event,
      action: entry.action,
      screen: entry.screen,
      user_id: userId,
      app_version: import.meta.env.VITE_APP_VERSION ?? "1.0",
      platform: Capacitor.getPlatform(),
      duration_ms: entry.durationMs,
      http_status: entry.httpStatus,
      error_code: entry.errorCode,
      metadata: sanitizeObservabilityData(entry.metadata),
    });
  } catch {
    // Diagnostics must never disrupt the user action that produced them.
  }
};

const log = (entry: ObservabilityEvent) => {
  const safeEntry = { ...entry, metadata: sanitizeObservabilityData(entry.metadata) };
  const writer = entry.level === "error" ? console.error : entry.level === "warn" ? console.warn : console.info;
  writer("[Hypou]", safeEntry);
  void persist(safeEntry);
};

export const logInfo = (event: string, action: string, traceId: string, metadata?: ObservabilityData) =>
  log({ traceId, source: "client", level: "info", event, action, screen: currentScreen(), metadata });

export const logWarn = (event: string, action: string, traceId: string, metadata?: ObservabilityData) =>
  log({ traceId, source: "client", level: "warn", event, action, screen: currentScreen(), metadata });

export const logError = (
  event: string,
  action: string,
  traceId: string,
  error: unknown,
  metadata?: ObservabilityData,
) => log({
  traceId,
  source: "client",
  level: "error",
  event,
  action,
  screen: currentScreen(),
  metadata,
  ...describeError(error),
});

let globalMonitoringInstalled = false;
const recentConsoleErrors = new Map<string, number>();

const shouldPersistConsoleError = (error: unknown) => {
  const name = error && typeof error === "object" && "name" in error && typeof (error as { name?: unknown }).name === "string"
    ? (error as { name: string }).name
    : "UNKNOWN_ERROR";
  const fingerprint = `${currentScreen() ?? "unknown"}:${name}`;
  const now = Date.now();
  const lastSeen = recentConsoleErrors.get(fingerprint) ?? 0;
  recentConsoleErrors.set(fingerprint, now);
  return now - lastSeen > 30_000;
};

export const installGlobalErrorMonitoring = () => {
  if (globalMonitoringInstalled || typeof window === "undefined") return;
  globalMonitoringInstalled = true;

  window.addEventListener("error", (event) => {
    logError("client.unhandled_error", "runtime", createTraceId("runtime"), event.error, {
      line: event.lineno,
      column: event.colno,
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    logError("client.unhandled_rejection", "runtime", createTraceId("runtime"), event.reason);
  });

  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    originalConsoleError(...args);
    // Existing handled errors still become diagnosable while avoiding a loop from this logger.
    if (args[0] === "[Hypou]") return;
    const error = args.find((value) => value instanceof Error) ?? args.find((value) => typeof value === "object");
    if (shouldPersistConsoleError(error)) {
      logError("client.console_error", "handled_error", createTraceId("console"), error);
    }
  };
};
