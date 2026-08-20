// Edge function: send-push
// Receives { user_id, title, body, data } from triggers, fans out via APNs or FCM.
// Auth: protected by PUSH_HOOK_SECRET (used as Bearer) — triggers send it via pg_net.

import { createClient } from "npm:@supabase/supabase-js@2";
import { createEdgeObservation, edgeLog, persistEdgeObservation } from "../_shared/observability.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ───────────── FCM HTTP v1 helpers ─────────────

function base64UrlEncode(input: ArrayBuffer | string): string {
  let str: string;
  if (typeof input === "string") str = btoa(input);
  else {
    const bytes = new Uint8Array(input);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    str = btoa(bin);
  }
  return str.replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

let cachedToken: { token: string; expires: number } | null = null;
let cachedApnsToken: { token: string; expires: number } | null = null;

async function getAccessToken(serviceAccount: any): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.token;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64UrlEncode(sig)}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(`OAuth error: ${JSON.stringify(json)}`);
  cachedToken = { token: json.access_token, expires: Date.now() + json.expires_in * 1000 };
  return cachedToken.token;
}

async function sendFcm(opts: {
  projectId: string;
  accessToken: string;
  token: string;
  title: string;
  body: string;
  data: Record<string, string>;
  platform: string;
}): Promise<{ ok: boolean; status: number; body: any }> {
  // FCM data values MUST be strings
  const dataStr: Record<string, string> = {};
  for (const [k, v] of Object.entries(opts.data || {})) dataStr[k] = String(v ?? "");

  const isIncomingCall = opts.data.type === "call";
  const conversationId = opts.data.conversation_id || "";
  const message: any = {
    token: opts.token,
    notification: { title: opts.title, body: opts.body },
    data: dataStr,
    android: {
      priority: "HIGH",
      notification: {
        channel_id: "default",
        sound: "default",
        priority: isIncomingCall ? "PRIORITY_MAX" : "PRIORITY_HIGH",
      },
    },
    apns: {
      headers: {
        "apns-priority": "10",
        "apns-push-type": "alert",
      },
      payload: {
        aps: {
          sound: "default",
          "content-available": 1,
          ...(isIncomingCall ? { "interruption-level": "time-sensitive", category: "HYPOU_CALL" } : {}),
          ...(conversationId ? { "thread-id": conversationId } : {}),
        },
      },
    },
  };

  const resp = await fetch(
    `https://fcm.googleapis.com/v1/projects/${opts.projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    },
  );
  const text = await resp.text();
  let parsed: any;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { ok: resp.ok, status: resp.status, body: parsed };
}

// Capacitor returns an APNs token on iOS, not an FCM registration token. Those
// tokens must be delivered directly to Apple's Push Notification service.
async function getApnsAuthToken(opts: {
  keyId: string;
  teamId: string;
  privateKey: string;
}): Promise<string> {
  if (cachedApnsToken && cachedApnsToken.expires > Date.now() + 60_000) {
    return cachedApnsToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64UrlEncode(JSON.stringify({ alg: "ES256", kid: opts.keyId }))}.${base64UrlEncode(JSON.stringify({ iss: opts.teamId, iat: now }))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(opts.privateKey.replace(/\\n/g, "\n")),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsigned),
  );
  const token = `${unsigned}.${base64UrlEncode(signature)}`;
  cachedApnsToken = { token, expires: Date.now() + 50 * 60_000 };
  return token;
}

async function sendApns(opts: {
  token: string;
  authToken: string;
  bundleId: string;
  title: string;
  body: string;
  data: Record<string, string>;
}): Promise<{ ok: boolean; status: number; body: any }> {
  const isIncomingCall = opts.data.type === "call";
  const conversationId = opts.data.conversation_id || "";
  const payload = {
    aps: {
      alert: { title: opts.title, body: opts.body },
      sound: "default",
      "content-available": 1,
      ...(isIncomingCall ? { "interruption-level": "time-sensitive", category: "HYPOU_CALL" } : {}),
      ...(conversationId ? { "thread-id": conversationId } : {}),
    },
    ...opts.data,
  };
  const resp = await fetch(`https://api.push.apple.com/3/device/${opts.token}`, {
    method: "POST",
    headers: {
      Authorization: `bearer ${opts.authToken}`,
      "apns-topic": opts.bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await resp.text();
  let parsed: any;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { ok: resp.ok, status: resp.status, body: parsed };
}

// ───────────── main handler ─────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const observation = createEdgeObservation(req, "send-push");
  let supabase: any;
  edgeLog(observation, "info", "push.request_started");

  try {
    // Validate caller: must include the push hook secret (triggers send it via pg_net)
    const auth = req.headers.get("Authorization") || "";
    const pushHookSecret = Deno.env.get("PUSH_HOOK_SECRET");
    if (!pushHookSecret || auth !== `Bearer ${pushHookSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, title, body, data } = await req.json();
    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "user_id + title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    observation.userId = typeof user_id === "string" ? user_id : undefined;
    supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: tokens, error: tErr } = await supabase
      .from("device_tokens")
      .select("token, platform")
      .eq("user_id", user_id);
    if (tErr) throw tErr;
    if (!tokens || tokens.length === 0) {
      edgeLog(observation, "warn", "push.no_device_tokens");
      await persistEdgeObservation(supabase, observation, "warn", "push.no_device_tokens", {
        action: "push_delivery",
        httpStatus: 200,
      });
      return new Response(JSON.stringify({ ok: false, sent: 0, reason: "no_device_tokens" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const iosTokens = tokens.filter((t: any) => t.platform === "ios");
    const fcmTokens = tokens.filter((t: any) => t.platform !== "ios");
    const dataStr = Object.fromEntries(
      Object.entries(data || {}).map(([key, value]) => [key, String(value ?? "")]),
    );

    const apnsKeyId = Deno.env.get("APNS_KEY_ID");
    const apnsTeamId = Deno.env.get("APNS_TEAM_ID");
    const apnsPrivateKey = Deno.env.get("APNS_PRIVATE_KEY");
    if (iosTokens.length && (!apnsKeyId || !apnsTeamId || !apnsPrivateKey)) {
      edgeLog(observation, "error", "push.apns_not_configured");
      await persistEdgeObservation(supabase, observation, "error", "push.apns_not_configured", {
        action: "push_delivery",
        httpStatus: 503,
      });
      return new Response(JSON.stringify({ error: "Push notifications are not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let apnsAuthToken = "";
    if (iosTokens.length) {
      apnsAuthToken = await getApnsAuthToken({
        keyId: apnsKeyId!, teamId: apnsTeamId!, privateKey: apnsPrivateKey!,
      });
    }

    const fcmJson = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
    let serviceAccount: any;
    let accessToken = "";
    if (fcmTokens.length) {
      if (!fcmJson) {
        edgeLog(observation, "error", "push.fcm_not_configured");
        await persistEdgeObservation(supabase, observation, "error", "push.fcm_not_configured", {
          action: "push_delivery",
          httpStatus: 503,
        });
        return new Response(JSON.stringify({ error: "Push notifications are not configured" }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try { serviceAccount = JSON.parse(fcmJson); }
      catch { throw new Error("FCM_SERVICE_ACCOUNT_JSON is not valid JSON"); }
      accessToken = await getAccessToken(serviceAccount);
    }

    const results = await Promise.all(
      tokens.map((t: any) =>
        t.platform === "ios"
          ? sendApns({
            token: t.token, authToken: apnsAuthToken, bundleId: "app.hypou.mobile",
            title, body: body || "", data: dataStr,
          }).catch((e) => ({ ok: false, status: 0, body: String(e) }))
          : sendFcm({
            projectId: serviceAccount.project_id, accessToken, token: t.token, platform: t.platform,
            title, body: body || "", data: data || {},
          }).catch((e) => ({ ok: false, status: 0, body: String(e) })),
      ),
    );

    // Cleanup invalid tokens (UNREGISTERED / INVALID_ARGUMENT)
    const toDelete: string[] = [];
    results.forEach((r, i) => {
      const errStr = JSON.stringify(r.body ?? "");
      if (r.status === 400 || r.status === 404 || r.status === 410 || errStr.includes("UNREGISTERED") || errStr.includes("INVALID_ARGUMENT")) {
        toDelete.push(tokens[i].token);
      }
    });
    if (toDelete.length) {
      await supabase.from("device_tokens").delete().in("token", toDelete);
    }

    const sent = results.filter((r) => r.ok).length;
    const failed = results.length - sent;
    if (failed > 0) {
      edgeLog(observation, "warn", "push.delivery_partial_failure", { sent, failed, total: tokens.length });
      await persistEdgeObservation(supabase, observation, "warn", "push.delivery_partial_failure", {
        action: "push_delivery",
        httpStatus: sent > 0 ? 200 : 502,
        metadata: { sent, failed, total: tokens.length, removed: toDelete.length },
      });
    } else {
      edgeLog(observation, "info", "push.request_completed", { sent, total: tokens.length });
    }
    return new Response(JSON.stringify({
      ok: sent > 0,
      sent,
      total: tokens.length,
      removed: toDelete.length,
      failures: results.filter((r) => !r.ok).map((r) => ({ status: r.status, body: r.body })),
    }), {
      status: sent > 0 ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    edgeLog(observation, "error", "push.request_failed", {
      errorName: e instanceof Error ? e.name : "UnknownError",
    });
    if (supabase) {
      await persistEdgeObservation(supabase, observation, "error", "push.request_failed", {
        action: "push_delivery",
        httpStatus: 500,
        error: e,
      });
    }
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
