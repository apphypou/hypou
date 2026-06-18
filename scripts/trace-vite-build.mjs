import { spawnSync } from "node:child_process";
import { writeFileSync, rmSync } from "node:fs";

const configPath = ".vite.trace.config.mjs";

writeFileSync(
  configPath,
  `
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

const isMobileBuild = process.env.HYPOU_MOBILE_BUILD === "1";
let count = 0;

const trace = {
  name: "hypou-build-trace",
  transform(_code, id) {
    if (id.includes("/src/") || id.includes("/node_modules/livekit") || id.includes("/node_modules/recharts")) {
      console.error(String(++count).padStart(4), id);
    }
    return null;
  },
};

export default {
  define: { __HYPOU_MOBILE_BUILD__: JSON.stringify(isMobileBuild) },
  plugins: [trace, react()],
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "./src") },
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
  },
};
`
);

const result = spawnSync("node", ["node_modules/vite/bin/vite.js", "build", "--config", configPath], {
  stdio: "inherit",
  env: { ...process.env, HYPOU_MOBILE_BUILD: "1" },
});

rmSync(configPath, { force: true });
process.exit(result.status ?? 1);
