import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { ensureMobileNode } from "./mobile-node.mjs";

ensureMobileNode();

const platform = process.argv.includes("--android") ? "android" : "ios";
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
    fail(`Pouco espaco livre em disco: ${availableGb.toFixed(1)}GB. Libere pelo menos 15GB antes de builds mobile`);
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

if (platform === "ios") {
  if (!existsSync("ios/App/App.xcodeproj")) fail("Missing iOS Xcode project");

  try {
    run("xcodebuild", ["-version"]);
  } catch {
    fail("Xcode command line tools not available");
  }
}

if (platform === "android") {
  const externalAndroidHome = "/Volumes/ADATA SC735/Android/sdk";
  const defaultAndroidHome = `${process.env.HOME}/Library/Android/sdk`;
  const androidHome = process.env.ANDROID_HOME
    || process.env.ANDROID_SDK_ROOT
    || [externalAndroidHome, defaultAndroidHome].find((path) => existsSync(path))
    || externalAndroidHome;

  const externalJavaHome = "/Volumes/ADATA SC735/Applications/Android Studio.app/Contents/jbr/Contents/Home";
  const defaultJavaHome = "/Applications/Android Studio.app/Contents/jbr/Contents/Home";
  const javaHome = process.env.JAVA_HOME
    || [externalJavaHome, defaultJavaHome].find((path) => existsSync(`${path}/bin/java`))
    || externalJavaHome;

  if (!existsSync(`${javaHome}/bin/java`)) fail(`Android Studio JDK not found: ${javaHome}`);
  if (!existsSync(`${androidHome}/platform-tools/adb`)) fail(`Android platform-tools not found: ${androidHome}`);
  if (!existsSync(`${androidHome}/platforms/android-36`)) fail(`Android SDK 36 not found: ${androidHome}`);
  if (!existsSync("android/gradlew")) fail("Missing Android Gradle project");

  run(`${javaHome}/bin/java`, ["-version"]);
  run(`${androidHome}/platform-tools/adb`, ["version"]);
}

console.log(`OK: mobile ${platform} environment is usable`);
