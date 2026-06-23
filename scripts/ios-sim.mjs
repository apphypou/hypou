import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { ensureMobileNode } from "./mobile-node.mjs";

ensureMobileNode();

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: "inherit", env: process.env, ...opts });
const out = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8" }).trim();

const node = process.execPath;
const derivedData = "build/ios-sim";
const appPath = `${derivedData}/Build/Products/Debug-iphonesimulator/HYPOU.app`;

run(node, ["scripts/mobile-doctor.mjs"]);
run(node, ["scripts/build-mobile.mjs"]);
run(node, ["scripts/sync-ios-web.mjs"]);

const sims = JSON.parse(out("xcrun", ["simctl", "list", "devices", "booted", "--json"]));
const booted = Object.values(sims.devices).flat().find((device) => device.state === "Booted");
if (!booted) {
  console.error("FAIL: abra um iPhone Simulator antes de rodar ios:sim");
  process.exit(1);
}

run("xcodebuild", [
  "-project", "ios/App/App.xcodeproj",
  "-scheme", "App",
  "-configuration", "Debug",
  "-destination", `id=${booted.udid}`,
  "-derivedDataPath", derivedData,
  "build",
]);

if (!existsSync(appPath)) {
  console.error(`FAIL: app nao encontrado em ${appPath}`);
  process.exit(1);
}

run("xcrun", ["simctl", "uninstall", booted.udid, "app.hypou.mobile"], { stdio: "ignore" });
run("xcrun", ["simctl", "install", booted.udid, appPath]);
run("xcrun", ["simctl", "launch", booted.udid, "app.hypou.mobile"]);
