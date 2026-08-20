import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const forbiddenTracked = [
  /^\.env$/,
  /(^|\/)\.DS_Store$/,
  /(^|\/)(build|dist)(\/|$)/,
  /(^|\/)\.hexem(\/|$)/,
  /(^|\/)google-services.*\.json$/,
  /(^|\/).+\.(jks|keystore|tsbuildinfo)$/,
  /^docs\/superpowers\//,
];

const forbiddenLivePaths = [
  ".hexem",
  "docs/superpowers",
  "documentacao.md",
  "AUDITORIA_BUGS.md",
  "PLANO_DESIGN_8_5_A_9.md",
  "design-qa.md",
];

const violations = trackedFiles.filter(
  (file) => existsSync(file) && forbiddenTracked.some((rule) => rule.test(file)),
);
violations.push(...forbiddenLivePaths.filter((file) => existsSync(file)));

if (violations.length > 0) {
  console.error("Repository hygiene check failed:");
  for (const file of [...new Set(violations)].sort()) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("OK: repository hygiene checks passed.");
