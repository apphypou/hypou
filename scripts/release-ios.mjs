import { execFileSync } from "node:child_process";

const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit" });

run("npm", ["run", "mobile:doctor"]);
run("npm", ["run", "build:mobile"]);
run("node", ["node_modules/@capacitor/cli/bin/capacitor", "sync", "ios"]);
run("node", ["node_modules/@capacitor/cli/bin/capacitor", "open", "ios"]);
