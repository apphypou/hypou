// Edge function: send-push
// Receives { user_id, title, body, data } from triggers, fans out via FCM HTTP v1.
// Auth: protected by SUPABASE_SERVICE_ROLE_KEY (used as Bearer) — triggers send it via pg_net.

import { createClient } from "npm:@supabase/supabase-js@2";

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

  const message: any = {
    token: opts.token,
    notification: { title: opts.title, body: opts.body },
    data: dataStr,
    android: {
      priority: "HIGH",
      notification: { channel_id: "default", sound: "default" },
    },
    apns: {
      headers: { "apns-priority": "10" },
      payload: {
        aps: { sound: "default", "content-available": 1 },
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

// ───────────── main handler ─────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Validate caller: must include service role key (triggers send it via pg_net)
    const auth = req.headers.get("Authorization") || "";
    if (auth !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fcmJson = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
    if (!fcmJson) {
      // Not configured yet — accept silently so triggers don't error
      return new Response(JSON.stringify({ ok: true, skipped: "FCM not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let serviceAccount: any;
    try { serviceAccount = JSON.parse(fcmJson); }
    catch { throw new Error("FCM_SERVICE_ACCOUNT_JSON is not valid JSON"); }

    const { user_id, title, body, data } = await req.json();
    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "user_id + title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: tokens, error: tErr } = await supabase
      .from("device_tokens")
      .select("token, platform")
      .eq("user_id", user_id);
    if (tErr) throw tErr;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    const results = await Promise.all(
      tokens.map((t: any) =>
        sendFcm({
          projectId, accessToken, token: t.token, platform: t.platform,
          title, body: body || "", data: data || {},
        }).catch((e) => ({ ok: false, status: 0, body: String(e) })),
      ),
    );

    // Cleanup invalid tokens (UNREGISTERED / INVALID_ARGUMENT)
    const toDelete: string[] = [];
    results.forEach((r, i) => {
      const errStr = JSON.stringify(r.body ?? "");
      if (r.status === 404 || errStr.includes("UNREGISTERED") || errStr.includes("INVALID_ARGUMENT")) {
        toDelete.push(tokens[i].token);
      }
    });
    if (toDelete.length) {
      await supabase.from("device_tokens").delete().in("token", toDelete);
    }

    const sent = results.filter((r) => r.ok).length;
    return new Response(JSON.stringify({ ok: true, sent, total: tokens.length, removed: toDelete.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-push error", e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
