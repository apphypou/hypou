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
const interesting = (id) =>
  id.includes("/src/") ||
  id.endsWith("/index.html") ||
  id.includes("/node_modules/.vite") ||
  id.includes("/node_modules/@capacitor") ||
  id.includes("/node_modules/livekit") ||
  id.includes("/node_modules/recharts");

const trace = {
  name: "hypou-build-trace",
  enforce: "pre",
  resolveId(source, importer) {
    if (source.includes("/src/") || source.startsWith("@/") || source.startsWith("./src") || source === "/src/main.tsx") {
      console.error(String(++count).padStart(4), "resolve", source, importer || "");
    }
    return null;
  },
  load(id) {
    if (interesting(id)) {
      console.error(String(++count).padStart(4), "load", id);
    }
    return null;
  },
  transform(_code, id) {
    if (interesting(id)) {
      console.error(String(++count).padStart(4), "transform", id);
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
    reportCompressedSize: false,
  },
  css: { postcss: { plugins: [] } },
};
`
);

const result = spawnSync("node", ["node_modules/vite/bin/vite.js", "build", "--config", configPath], {
  stdio: "inherit",
  env: { ...process.env, HYPOU_MOBILE_BUILD: "1" },
});

rmSync(configPath, { force: true });
process.exit(result.status ?? 1);
