import { execFileSync, spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { ensureMobileNode } from "./mobile-node.mjs";

ensureMobileNode();

const port = process.env.HYPOU_DEV_PORT || "8081";
const host = process.env.HYPOU_DEV_HOST || "0.0.0.0";
const serverUrl = process.env.HYPOU_CAP_SERVER_URL || `http://localhost:${port}`;
const node = process.execPath;
const appId = "app.hypou.mobile";
const derivedData = "build/ios-dev";
const appPath = `${derivedData}/Build/Products/Debug-iphonesimulator/HYPOU.app`;

const run = (cmd, args, opts = {}) => {
  console.log(`$ ${[cmd, ...args].join(" ")}`);
  return execFileSync(cmd, args, {
    stdio: "inherit",
    env: process.env,
    ...opts,
  });
};

const output = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, {
    encoding: "utf8",
    env: process.env,
    ...opts,
  }).trim();

const wait = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const portIsOpen = () => {
  const result = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], {
    stdio: "ignore",
  });
  return result.status === 0;
};

const getBootedSimulator = () => {
  const sims = JSON.parse(output("xcrun", ["simctl", "list", "devices", "booted", "--json"]));
  return Object.values(sims.devices).flat().find((device) => device.state === "Booted");
};

let viteProcess;
if (portIsOpen()) {
  console.log(`OK: usando dev server existente em http://localhost:${port}`);
} else {
  console.log(`OK: iniciando Vite em http://localhost:${port}`);
  viteProcess = spawn(
    node,
    ["node_modules/vite/bin/vite.js", "--host", host, "--port", port, "--strictPort"],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        HYPOU_MOBILE_BUILD: "1",
      },
    },
  );

  process.on("exit", () => viteProcess?.kill());
  process.on("SIGINT", () => {
    viteProcess?.kill();
    process.exit(130);
  });

  const deadline = Date.now() + 30_000;
  while (!portIsOpen()) {
    if (Date.now() > deadline) {
      console.error(`FAIL: Vite nao abriu a porta ${port}`);
      viteProcess?.kill();
      process.exit(1);
    }
    wait(250);
  }
}

run(node, ["scripts/mobile-doctor.mjs"]);
run(node, ["scripts/sync-ios-web.mjs"], {
  env: {
    ...process.env,
    HYPOU_CAP_SERVER_URL: serverUrl,
  },
});

const booted = getBootedSimulator();
if (!booted) {
  console.error("FAIL: abra um iPhone Simulator antes de rodar npm run ios:dev");
  process.exit(1);
}

run("xcodebuild", [
  "-project",
  "ios/App/App.xcodeproj",
  "-scheme",
  "App",
  "-configuration",
  "Debug",
  "-destination",
  `id=${booted.udid}`,
  "-derivedDataPath",
  derivedData,
  "build",
]);

if (!existsSync(appPath)) {
  console.error(`FAIL: app nao encontrado em ${appPath}`);
  process.exit(1);
}

spawnSync("xcrun", ["simctl", "uninstall", booted.udid, appId], { stdio: "ignore" });
run("xcrun", ["simctl", "install", booted.udid, appPath]);
run("xcrun", ["simctl", "launch", booted.udid, appId]);

console.log("");
console.log(`OK: Hypou instalado no Simulator apontando para ${serverUrl}`);
console.log("Deixe este terminal aberto para manter o Vite rodando. Ctrl+C encerra.");

if (viteProcess) {
  await new Promise((resolve) => viteProcess.on("exit", resolve));
}
