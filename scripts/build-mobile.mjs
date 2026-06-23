import { spawn } from "node:child_process";
import { ensureMobileNode } from "./mobile-node.mjs";

ensureMobileNode();

const startedAt = Date.now();

console.log(`build:mobile usando ${process.version}`);

const child = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "build", "--config", "vite.mobile.config.ts"], {
  stdio: "inherit",
  env: { ...process.env, HYPOU_MOBILE_BUILD: "1" },
});

const exitCode = await new Promise((resolve) => {
  child.on("close", resolve);
  child.on("error", (error) => {
    console.error(error);
    resolve(1);
  });
});

if (exitCode !== 0) process.exit(Number(exitCode) || 1);

console.log(`build:mobile concluido em ${Math.round((Date.now() - startedAt) / 1000)}s`);
