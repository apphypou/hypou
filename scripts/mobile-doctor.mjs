import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const run = (cmd, args = []) => execFileSync(cmd, args, { stdio: "pipe", encoding: "utf8" }).trim();
const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
};

const node = run("node", ["-v"]);
const major = Number(node.replace(/^v/, "").split(".")[0]);
if (major < 22 || major > 24) fail(`Use Node >=22 <25 for mobile releases. Current: ${node}`);

run("npm", ["--version"]);

if (!existsSync("node_modules/@capacitor/cli/bin/capacitor")) fail("Missing local Capacitor CLI. Run npm install");
const capPackage = JSON.parse(readFileSync("node_modules/@capacitor/cli/package.json", "utf8"));
if (!capPackage.version) fail("Could not read Capacitor CLI version");

if (!existsSync("ios/App/App.xcodeproj")) fail("Missing iOS Xcode project");

try {
  run("xcodebuild", ["-version"]);
} catch {
  fail("Xcode command line tools not available");
}

console.log("OK: mobile environment is usable");
