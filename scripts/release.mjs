import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { ensureMobileNode } from "./mobile-node.mjs";

ensureMobileNode();

const [target, ...options] = process.argv.slice(2);
const knownTargets = new Set(["web", "ios", "android", "status"]);
const checkOnly = options.includes("--check");
const publish = options.includes("--publish");
const confirmTestFlight = options.includes("--confirm-testflight");

const usage = () => {
  console.log(`Hypou release center

Usage:
  npm run release -- status
  npm run release -- web [--check]
  npm run release -- ios [--check] [--publish --confirm-testflight]
  npm run release -- android [--check]

Targets:
  web      validates the public site and admin panel build.
  ios      validates the mobile release, prepares Xcode, or uploads TestFlight.
  android  validates the mobile release and prepares Android Studio.
  status   shows the commit and native build numbers without changing anything.

Every release target requires a clean Git working tree. TestFlight upload also
requires explicit confirmation and App Store Connect API credentials.`);
};

const run = (command, args) => execFileSync(command, args, {
  stdio: "inherit",
  env: process.env,
});

const capture = (command, args) => execFileSync(command, args, {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
}).trim();

const requireCleanWorktree = () => {
  const changes = capture("git", ["status", "--porcelain"]);
  if (changes) {
    throw new Error("Release blocked: commit or stash local changes before creating a release.");
  }
};

const requireEnvironment = (names) => {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Release blocked: configure ${missing.join(", ")}.`);
  }
};

const readFirstMatch = (path, expression) => {
  if (!existsSync(path)) return "not found";
  return readFileSync(path, "utf8").match(expression)?.[1] || "not found";
};

const showStatus = () => {
  const branch = capture("git", ["branch", "--show-current"]);
  const commit = capture("git", ["rev-parse", "--short", "HEAD"]);
  const dirty = Boolean(capture("git", ["status", "--porcelain"]));
  const iosProject = "ios/App/App.xcodeproj/project.pbxproj";
  const androidGradle = "android/app/build.gradle";
  const trackedEnv = capture("git", ["ls-files", ".env"]);
  const trackedAndroid = capture("git", ["ls-files", "android"]);

  console.log("Hypou release status");
  console.log(`Git: ${branch || "detached"} @ ${commit}${dirty ? " (changes pending)" : " (clean)"}`);
  console.log(`iOS: version ${readFirstMatch(iosProject, /MARKETING_VERSION = ([^;]+);/)}, build ${readFirstMatch(iosProject, /CURRENT_PROJECT_VERSION = ([^;]+);/)}`);
  console.log(`Android: version ${readFirstMatch(androidGradle, /versionName "([^"]+)"/)}, code ${readFirstMatch(androidGradle, /versionCode (\d+)/)}`);

  if (trackedEnv) {
    console.warn("WARNING: .env is tracked by Git. Review and remove secrets before enabling cloud releases.");
  }
  if (!trackedAndroid) {
    console.warn("WARNING: Android source is not tracked by Git yet. Do not create a store release from it.");
  }
};

const verifyWeb = () => {
  run("npm", ["run", "typecheck"]);
  run("npm", ["run", "lint"]);
  run("npm", ["test"]);
  run("npm", ["run", "build:web"]);
};

const verifyMobile = (platform) => {
  run("npm", ["run", "mobile:preflight", "--", ...(platform === "android" ? ["--android"] : [])]);
  run("npm", ["run", "build:mobile"]);
};

const releaseWeb = () => {
  verifyWeb();
  console.log("\nWeb release checks passed.");
  console.log("Push this commit to create the Vercel preview. After validating /teste and /admin, promote that preview in Vercel.");
};

const releaseIos = () => {
  verifyMobile("ios");
  if (checkOnly) return console.log("\niOS release checks passed.");

  if (publish) {
    if (!confirmTestFlight) {
      throw new Error("TestFlight upload requires --confirm-testflight.");
    }
    requireEnvironment([
      "APP_STORE_CONNECT_API_KEY_ID",
      "APP_STORE_CONNECT_ISSUER_ID",
      "APP_STORE_CONNECT_API_KEY_CONTENT",
    ]);
    run("npm", ["run", "ios:testflight:upload"]);
    return;
  }

  run("npm", ["run", "ios:testflight"]);
};

const releaseAndroid = () => {
  if (publish) {
    throw new Error("Android publishing is blocked until the upload keystore and Google Play service account are configured outside Git.");
  }
  verifyMobile("android");
  if (checkOnly) return console.log("\nAndroid release checks passed.");
  run("npm", ["run", "mobile:android"]);
};

try {
  if (!target || target === "--help" || target === "-h") {
    usage();
  } else if (!knownTargets.has(target)) {
    throw new Error(`Unknown release target: ${target}`);
  } else if (target === "status") {
    showStatus();
  } else {
    requireCleanWorktree();
    if (target === "web") releaseWeb();
    if (target === "ios") releaseIos();
    if (target === "android") releaseAndroid();
  }
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
