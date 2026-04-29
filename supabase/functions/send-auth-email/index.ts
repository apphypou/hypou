// Supabase Auth → Send Email Hook (Standard Webhook)
// Validates HMAC signature and renders branded Hypou emails via Resend.
// Docs: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook

import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import {
  emailChangeTemplate,
  inviteTemplate,
  magicLinkTemplate,
  recoveryTemplate,
  signupTemplate,
} from "./_templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

const FROM = "Hypou <no-reply@mail.hypou.app>";
const SITE_URL = "https://app.hypou.app";

interface AuthEmailPayload {
  user: { email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type:
      | "signup"
      | "recovery"
      | "magiclink"
      | "invite"
      | "email_change"
      | "email_change_current"
      | "email_change_new"
      | "reauthentication";
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

function buildConfirmationUrl(p: AuthEmailPayload): string {
  const { token_hash, email_action_type, redirect_to, site_url } = p.email_data;
  const base = (site_url || SITE_URL).replace(/\/$/, "");
  const redirect = redirect_to || SITE_URL;
  const type = email_action_type === "magiclink" ? "magiclink" : email_action_type;
  return `${base}/auth/v1/verify?token=${token_hash}&type=${type}&redirect_to=${encodeURIComponent(redirect)}`;
}

function renderEmail(p: AuthEmailPayload): { subject: string; html: string } {
  const url = buildConfirmationUrl(p);
  switch (p.email_data.email_action_type) {
    case "recovery":
      return recoveryTemplate(url);
    case "magiclink":
      return magicLinkTemplate(url);
    case "invite":
      return inviteTemplate(url);
    case "email_change":
    case "email_change_current":
    case "email_change_new":
      return emailChangeTemplate(url);
    case "signup":
    default:
      return signupTemplate(url);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    if (!HOOK_SECRET) throw new Error("SEND_EMAIL_HOOK_SECRET not configured");

    const payloadRaw = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Standard Webhooks signature verification
    // Supabase prefixes the secret with "v1,whsec_" — strip it for the verifier
    const secret = HOOK_SECRET.replace(/^v1,whsec_/, "").replace(/^whsec_/, "");
    const wh = new Webhook(secret);
    const payload = wh.verify(payloadRaw, headers) as AuthEmailPayload;

    const { subject, html } = renderEmail(payload);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [payload.user.email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend error", res.status, errBody);
      return new Response(
        JSON.stringify({ error: { http_code: res.status, message: errBody } }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("send-auth-email error:", msg);
    return new Response(
      JSON.stringify({ error: { http_code: 401, message: msg } }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
