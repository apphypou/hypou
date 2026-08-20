import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { ensureMobileNode } from "./mobile-node.mjs";

ensureMobileNode();

const mode = process.argv[2] || "--open";
const supportedModes = new Set(["--open", "--sync-only", "--run", "--debug-apk"]);

if (!supportedModes.has(mode)) {
  console.error(`FAIL: unsupported Android mode: ${mode}`);
  process.exit(1);
}

const externalAndroidHome = "/Volumes/ADATA SC735/Android/sdk";
const defaultAndroidHome = `${process.env.HOME}/Library/Android/sdk`;
const androidHome = process.env.ANDROID_HOME
  || process.env.ANDROID_SDK_ROOT
  || [externalAndroidHome, defaultAndroidHome].find((path) => existsSync(path))
  || externalAndroidHome;

const externalStudioPath = "/Volumes/ADATA SC735/Applications/Android Studio.app";
const defaultStudioPath = "/Applications/Android Studio.app";
const androidStudioPath = [externalStudioPath, defaultStudioPath].find((path) => existsSync(path))
  || externalStudioPath;
const javaHome = process.env.JAVA_HOME || `${androidStudioPath}/Contents/jbr/Contents/Home`;
const androidAvdHome = process.env.ANDROID_AVD_HOME || "/Volumes/ADATA SC735/Android/avd";
const androidEnv = {
  ...process.env,
  ANDROID_HOME: androidHome,
  ANDROID_SDK_ROOT: androidHome,
  ANDROID_AVD_HOME: androidAvdHome,
  JAVA_HOME: javaHome,
};

const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit", env: androidEnv });
const capacitor = ["node_modules/@capacitor/cli/bin/capacitor"];

if (!existsSync("android")) {
  console.error("FAIL: missing android/. Generate it explicitly before running Android workflows.");
  process.exit(1);
}

run("npm", ["run", "mobile:doctor:android"]);
run("npm", ["run", "build:mobile"]);
run("node", [...capacitor, "sync", "android"]);

if (mode === "--sync-only") {
  console.log("OK: Android web bundle and native plugins synchronized");
} else if (mode === "--run") {
  run("node", [...capacitor, "run", "android"]);
} else if (mode === "--debug-apk") {
  run("./android/gradlew", ["-p", "android", "assembleDebug"]);
  console.log("OK: android/app/build/outputs/apk/debug/app-debug.apk");
} else {
  run("open", ["-a", androidStudioPath, "android"]);
}
