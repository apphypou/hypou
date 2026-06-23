import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname } from "node:path";

const valid = (node) => {
  try {
    const version = execFileSync(node, ["-v"], { encoding: "utf8" }).trim();
    const major = Number(version.replace(/^v/, "").split(".")[0]);
    return major >= 22 && major < 25;
  } catch {
    return false;
  }
};

export const ensureMobileNode = () => {
  if (valid(process.execPath)) return;

  const candidates = [
    process.env.HYPOU_NODE,
    "/Users/will/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node",
  ].filter(Boolean);

  const node = candidates.find((candidate) => existsSync(candidate) && valid(candidate));
  if (!node) {
    console.error(`FAIL: mobile precisa Node >=22 <25. Atual: ${process.version}`);
    process.exit(1);
  }

  const result = spawnSync(node, process.argv.slice(1), {
    stdio: "inherit",
    env: {
      ...process.env,
      PATH: `${dirname(node)}:${process.env.PATH || ""}`,
    },
  });

  process.exit(result.status ?? 1);
};

