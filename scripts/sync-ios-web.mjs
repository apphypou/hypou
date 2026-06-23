import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { ensureMobileNode } from "./mobile-node.mjs";

ensureMobileNode();

const loadEnvFile = (path) => {
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;

    let value = match[2].trim();
    if (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
};

loadEnvFile(".env");
loadEnvFile(".env.local");

const distDir = "dist";
const publicDir = "ios/App/App/public";
const nativeConfigPath = "ios/App/App/capacitor.config.json";
const cordovaConfigPath = "ios/App/App/config.xml";
const infoPlistPath = "ios/App/App/Info.plist";
const devServerUrl = process.env.HYPOU_CAP_SERVER_URL;
const googleIOSClientId = process.env.VITE_GOOGLE_IOS_CLIENT_ID;
const googleReversedClientId = process.env.VITE_GOOGLE_IOS_REVERSED_CLIENT_ID;

if (!existsSync(distDir)) {
  console.error("FAIL: dist nao existe. Rode npm run build:mobile antes.");
  process.exit(1);
}

let existingConfig = {};
if (existsSync(nativeConfigPath)) {
  existingConfig = JSON.parse(readFileSync(nativeConfigPath, "utf8"));
}

const packageClassList = Array.from(new Set([
  ...(existingConfig.packageClassList || []).filter((plugin) => plugin !== "GoogleSignInPlugin"),
  "SharePlugin",
  "NativeGoogleSignInPlugin",
  "NativeAppleSignInPlugin",
]));

const config = {
  appId: "app.hypou.mobile",
  appName: "Hypou",
  webDir: "dist",
  ...(devServerUrl
    ? {
        server: {
          url: devServerUrl,
          cleartext: true,
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 3000,
      backgroundColor: "#1C1C1C",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1C1C1C",
    },
    Keyboard: {
      resize: "none",
      resizeOnFullScreen: true,
    },
  },
  packageClassList,
};

const plistBuddy = (args, opts = {}) => execFileSync("/usr/libexec/PlistBuddy", args, {
  stdio: opts.stdio || "pipe",
  encoding: "utf8",
});

const hasGoogleUrlScheme = () => {
  if (!googleReversedClientId || !existsSync(infoPlistPath)) return true;

  try {
    return plistBuddy(["-c", "Print :CFBundleURLTypes", infoPlistPath]).includes(googleReversedClientId);
  } catch {
    return false;
  }
};

const addGoogleUrlScheme = () => {
  if (!googleReversedClientId || hasGoogleUrlScheme()) return false;

  let index = 0;
  try {
    const urlTypes = plistBuddy(["-c", "Print :CFBundleURLTypes", infoPlistPath]);
    index = [...urlTypes.matchAll(/^    Dict \{/gm)].length;
  } catch {
    plistBuddy(["-c", "Add :CFBundleURLTypes array", infoPlistPath]);
  }

  plistBuddy(["-c", `Add :CFBundleURLTypes:${index} dict`, infoPlistPath]);
  plistBuddy(["-c", `Add :CFBundleURLTypes:${index}:CFBundleURLName string google`, infoPlistPath]);
  plistBuddy(["-c", `Add :CFBundleURLTypes:${index}:CFBundleURLSchemes array`, infoPlistPath]);
  plistBuddy(["-c", `Add :CFBundleURLTypes:${index}:CFBundleURLSchemes:0 string ${googleReversedClientId}`, infoPlistPath]);
  return true;
};

const setGoogleClientId = () => {
  if (!googleIOSClientId || !existsSync(infoPlistPath)) return false;

  try {
    plistBuddy(["-c", `Set :GIDClientID ${googleIOSClientId}`, infoPlistPath]);
  } catch {
    plistBuddy(["-c", `Add :GIDClientID string ${googleIOSClientId}`, infoPlistPath]);
  }

  return true;
};

rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });
cpSync(distDir, publicDir, { recursive: true });
writeFileSync(nativeConfigPath, `${JSON.stringify(config, null, 2)}\n`);
writeFileSync(
  cordovaConfigPath,
  `<?xml version="1.0" encoding="UTF-8"?>\n<widget xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">\n  <access origin="*" />\n</widget>\n`,
);
const setGoogleId = setGoogleClientId();
const addedGoogleScheme = addGoogleUrlScheme();

console.log(`OK: ${distDir} sincronizado em ${publicDir}`);
console.log(`OK: ${nativeConfigPath} ${devServerUrl ? `aponta para ${devServerUrl}` : "aponta para dist local"}`);
if (addedGoogleScheme) {
  console.log(`OK: ${infoPlistPath} recebeu URL scheme do Google`);
}
if (setGoogleId) {
  console.log(`OK: ${infoPlistPath} recebeu GIDClientID do Google`);
} else if (!googleReversedClientId) {
  console.log("WARN: VITE_GOOGLE_IOS_CLIENT_ID/VITE_GOOGLE_IOS_REVERSED_CLIENT_ID ausentes; login nativo Google no iOS usara fallback se necessario");
}
