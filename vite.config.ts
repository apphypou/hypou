import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import tailwindcss from "tailwindcss";

const isMobileBuild = process.env.HYPOU_MOBILE_BUILD === "1";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __HYPOU_MOBILE_BUILD__: JSON.stringify(isMobileBuild),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    watch: {
      ignored: ["**/build/**", "**/.codex-screenshots/**", "**/.superpowers/**"],
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: isMobileBuild
      ? undefined
      : {
          output: {
            manualChunks: {
              "react-vendor": ["react", "react-dom", "react-router-dom"],
              "framer": ["framer-motion"],
              "supabase": ["@supabase/supabase-js"],
              "query": ["@tanstack/react-query"],
            },
          },
        },
  },
}));
