import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

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
    !isMobileBuild &&
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "logo-hypou.png"],
        workbox: {
          navigateFallbackDenylist: [/^\/~oauth/],
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        },
        manifest: {
          name: "Hypou - Troque o que tá parado",
          short_name: "Hypou",
          description: "Plataforma de trocas inteligentes. Dê match, negocie e troque com segurança.",
          theme_color: "#0a0a0a",
          background_color: "#0a0a0a",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/logo-hypou.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/logo-hypou.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/logo-hypou.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
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
