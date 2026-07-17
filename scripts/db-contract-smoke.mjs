import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { ensureMobileNode } from "./mobile-node.mjs";

ensureMobileNode();

const dumpPath = "/tmp/hypou-remote-schema.sql";
// Keep remote checks pinned to Hypou's isolated CLI login; CI can override this.
const supabaseCli = process.env.HYPOU_SUPABASE_CLI || "./scripts/supabase-hypou";
const requiredRecentMigrations = [
  "20260616183000",
  "20260621190000",
  "20260625090000",
  "20260629120000",
  "20260701184500",
  "20260713150000",
  "20260713152000",
  "20260713160000",
  "20260713200000",
  "20260713210000",
  "20260714090000",
];
const requiredColumns = [
  /"focal_x" numeric DEFAULT 50 NOT NULL/,
  /"focal_y" numeric DEFAULT 50 NOT NULL/,
  /"cash_amount_cents" integer DEFAULT 0 NOT NULL/,
  /"cash_payer_user_id" "uuid"/,
  /"cancelled_at" timestamp with time zone/,
  /"cancelled_by" "uuid"/,
  /"cancellation_reason" "text"/,
];
const requiredFunctions = [
  /CREATE OR REPLACE FUNCTION "public"\."create_proposal"\("p_my_item_ids" "uuid"\[\], "p_their_item_id" "uuid", "p_cash_amount_cents" integer DEFAULT 0\)/,
  /CREATE OR REPLACE FUNCTION "public"\."get_my_matches"\(\)/,
  /CREATE OR REPLACE FUNCTION "public"\."recommended_items"\(/,
  /CREATE OR REPLACE FUNCTION "public"\."toggle_video_like"\(/,
  /CREATE OR REPLACE FUNCTION "public"\."increment_video_view"\(/,
  /CREATE OR REPLACE FUNCTION "public"\."get_user_ratings_with_items"\(/,
  /CREATE OR REPLACE FUNCTION "public"\."get_waitlist_position"\(\)/,
  /CREATE OR REPLACE FUNCTION "public"\."cancel_match"\("p_match_id" "uuid"\)/,
  /CREATE OR REPLACE FUNCTION "public"\."accept_match"\("p_match_id" "uuid"\)/,
  /CREATE OR REPLACE FUNCTION "public"\."reject_match"\("p_match_id" "uuid"\)/,
  /CREATE OR REPLACE FUNCTION "public"\."confirm_trade_delivery"\("p_match_id" "uuid"\)/,
  /CREATE OR REPLACE FUNCTION "public"\."notify_call_ended"\(\) RETURNS "trigger"/,
  /CREATE OR REPLACE FUNCTION "public"\."expire_ringing_calls"\(\) RETURNS integer/,
];
const requiredStoragePolicies = [
  "Avatar images are publicly accessible",
  "Item images are publicly accessible",
  "Anyone can view item videos storage",
  "Public can view chat media",
  "Users can upload item images",
  "Users can upload own item videos",
  "Users can upload own chat media",
  "Users can upload own avatar",
];
const requiredPublicPolicies = [
  "Conversation archive rows are visible to participants",
  "Participants can archive their conversations",
  "Participants can unarchive their conversations",
  "Caller can insert calls",
];

const run = (label, cmd, args) => {
  process.stdout.write(`\n==> ${label}\n`);
  const output = execFileSync(cmd, args, {
    encoding: "utf8",
    env: { ...process.env, SUPABASE_DISABLE_TELEMETRY: "1" },
    stdio: "pipe",
  });
  if (output.trim()) console.log(output.trim());
  return output;
};

const fail = (message) => {
  console.error(`\nFAIL: ${message}`);
  process.exit(1);
};

const migrationList = run("Supabase migration list", supabaseCli, ["migration", "list"]);
for (const version of requiredRecentMigrations) {
  const aligned = new RegExp(`${version}\\s+\\|\\s+${version}`).test(migrationList);
  if (!aligned) fail(`remote migration ${version} is not aligned with local history`);
}

run("Supabase db lint", supabaseCli, [
  "db",
  "lint",
  "--linked",
  "--schema",
  "public,storage",
  "--fail-on",
  "error",
]);

run("Supabase schema dump", supabaseCli, [
  "db",
  "dump",
  "--schema",
  "public",
  "--schema",
  "storage",
  "--file",
  dumpPath,
]);

if (!existsSync(dumpPath)) fail(`schema dump not found at ${dumpPath}`);
const schema = readFileSync(dumpPath, "utf8");

for (const pattern of requiredColumns) {
  if (!pattern.test(schema)) fail(`missing required column pattern: ${pattern}`);
}

for (const pattern of requiredFunctions) {
  if (!pattern.test(schema)) fail(`missing required function pattern: ${pattern}`);
}

for (const policy of requiredStoragePolicies) {
  if (!schema.includes(`CREATE POLICY "${policy}"`)) {
    fail(`missing required storage policy: ${policy}`);
  }
}

for (const policy of requiredPublicPolicies) {
  if (!schema.includes(`CREATE POLICY "${policy}"`)) {
    fail(`missing required public policy: ${policy}`);
  }
}

const tableNames = [...schema.matchAll(/^CREATE TABLE IF NOT EXISTS "public"\."([^"]+)"/gm)].map((m) => m[1]);
const rlsNames = [...schema.matchAll(/^ALTER TABLE "public"\."([^"]+)" ENABLE ROW LEVEL SECURITY;/gm)].map((m) => m[1]);
const missingRls = tableNames.filter((table) => !rlsNames.includes(table));
if (tableNames.length === 0) fail("no public tables found in remote schema dump");
if (missingRls.length > 0) fail(`public tables without RLS: ${missingRls.join(", ")}`);

const legacyCreateProposal = /CREATE OR REPLACE FUNCTION "public"\."create_proposal"\("p_my_item_ids" "uuid"\[\], "p_their_item_id" "uuid"\)/.test(schema);
if (legacyCreateProposal) {
  console.warn(
    "WARN: legacy create_proposal(uuid[], uuid) still exists remotely. Apply docs/database/sql/07_drop_legacy_create_proposal_rpc.sql when old mobile builds no longer need it.",
  );
}

console.log(`\nOK: remote DB contracts passed (${tableNames.length} public tables, ${rlsNames.length} with RLS).`);
