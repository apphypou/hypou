import { execFileSync } from "node:child_process";
import { ensureMobileNode } from "./mobile-node.mjs";

ensureMobileNode();

const startedAt = Date.now();
const upload = process.argv.includes("--upload");
const run = (cmd, args, opts = {}) => {
  console.log(`$ ${[cmd, ...args].join(" ")}`);
  return execFileSync(cmd, args, {
    stdio: "inherit",
    env: process.env,
    timeout: 300_000,
    ...opts,
  });
};
const node = process.execPath;

run(node, ["scripts/mobile-doctor.mjs"]);
run(node, ["scripts/build-mobile.mjs"]);
run(node, ["scripts/sync-ios-web.mjs"]);

if (upload) {
  try {
    run("bundle", ["exec", "fastlane", "ios", "beta"], { timeout: 1_800_000 });
  } catch {
    run("fastlane", ["ios", "beta"], { timeout: 1_800_000 });
  }
} else {
  run(node, ["node_modules/@capacitor/cli/bin/capacitor", "open", "ios"]);
}

console.log(`release-ios concluido em ${Math.round((Date.now() - startedAt) / 1000)}s`);
