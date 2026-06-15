import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [
    {
      name: "debug-transform-stall",
      transform(_code, id) {
        if (process.env.DEBUG_TRANSFORM === "1") {
          console.log(id);
        }
        return null;
      },
    },
  ],
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          framer: ["framer-motion"],
          supabase: ["@supabase/supabase-js"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
});
