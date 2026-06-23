import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { ensureMobileNode } from "./mobile-node.mjs";

ensureMobileNode();

const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit" });

run("npm", ["run", "mobile:doctor"]);
run("npm", ["run", "build:mobile"]);

if (!existsSync("android")) {
  run("node", ["node_modules/@capacitor/cli/bin/capacitor", "add", "android"]);
}

run("node", ["node_modules/@capacitor/cli/bin/capacitor", "sync", "android"]);
run("node", ["node_modules/@capacitor/cli/bin/capacitor", "open", "android"]);
