import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { ensureMobileNode } from "./mobile-node.mjs";

ensureMobileNode();

const run = (cmd, args = []) => execFileSync(cmd, args, { stdio: "pipe", encoding: "utf8" }).trim();
const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
};

const node = run("node", ["-v"]);
const major = Number(node.replace(/^v/, "").split(".")[0]);
if (major < 22 || major > 24) fail(`Use Node >=22 <25 for mobile releases. Current: ${node}`);

run("npm", ["--version"]);

const cwd = process.cwd();
if (cwd.includes("/Documents/")) {
  fail(`Workspace em Documents: ${cwd}. Mova para uma pasta local nao sincronizada, ex: /Users/will/Developer/HYPOU`);
}

try {
  const df = run("df", ["-Pk", cwd]).split("\n").at(-1)?.trim().split(/\s+/);
  const availableKb = Number(df?.[3] || 0);
  const availableGb = availableKb / 1024 / 1024;
  if (availableGb < 15) {
    fail(`Pouco espaco livre em disco: ${availableGb.toFixed(1)}GB. Libere pelo menos 15GB antes de builds iOS/TestFlight`);
  }
} catch {
  fail("Nao foi possivel verificar espaco livre em disco");
}

if (!existsSync("node_modules/@capacitor/cli/bin/capacitor")) fail("Missing local Capacitor CLI. Run npm install");
const capPackage = JSON.parse(readFileSync("node_modules/@capacitor/cli/package.json", "utf8"));
if (!capPackage.version) fail("Could not read Capacitor CLI version");

const fsProbe = "node_modules/react-style-singleton/dist/es2015/singleton.js";
if (existsSync(fsProbe)) {
  readFileSync(fsProbe, "utf8");
}

if (!existsSync("ios/App/App.xcodeproj")) fail("Missing iOS Xcode project");

try {
  run("xcodebuild", ["-version"]);
} catch {
  fail("Xcode command line tools not available");
}

console.log("OK: mobile environment is usable");
