import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { ensureMobileNode } from "./mobile-node.mjs";

ensureMobileNode();

const dumpPath = "/tmp/hypou-remote-schema.sql";
const requiredRecentMigrations = [
  "20260616183000",
  "20260621190000",
];
const requiredColumns = [
  /"focal_x" numeric DEFAULT 50 NOT NULL/,
  /"focal_y" numeric DEFAULT 50 NOT NULL/,
  /"cash_amount_cents" integer DEFAULT 0 NOT NULL/,
  /"cash_payer_user_id" "uuid"/,
];
const requiredFunctions = [
  /CREATE OR REPLACE FUNCTION "public"\."create_proposal"\("p_my_item_ids" "uuid"\[\], "p_their_item_id" "uuid", "p_cash_amount_cents" integer DEFAULT 0\)/,
  /CREATE OR REPLACE FUNCTION "public"\."get_my_matches"\(\)/,
  /CREATE OR REPLACE FUNCTION "public"\."recommended_items"\(/,
  /CREATE OR REPLACE FUNCTION "public"\."toggle_video_like"\(/,
  /CREATE OR REPLACE FUNCTION "public"\."increment_video_view"\(/,
  /CREATE OR REPLACE FUNCTION "public"\."get_user_ratings_with_items"\(/,
  /CREATE OR REPLACE FUNCTION "public"\."get_waitlist_position"\(\)/,
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

const run = (label, cmd, args) => {
  process.stdout.write(`\n==> ${label}\n`);
  const output = execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe" });
  if (output.trim()) console.log(output.trim());
  return output;
};

const fail = (message) => {
  console.error(`\nFAIL: ${message}`);
  process.exit(1);
};

const migrationList = run("Supabase migration list", "supabase", ["migration", "list"]);
for (const version of requiredRecentMigrations) {
  const aligned = new RegExp(`${version}\\s+\\|\\s+${version}`).test(migrationList);
  if (!aligned) fail(`remote migration ${version} is not aligned with local history`);
}

run("Supabase db lint", "supabase", [
  "db",
  "lint",
  "--linked",
  "--schema",
  "public,storage",
  "--fail-on",
  "error",
]);

run("Supabase schema dump", "supabase", [
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
