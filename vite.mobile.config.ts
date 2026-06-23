import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "tailwindcss";

export default defineConfig({
  define: {
    __HYPOU_MOBILE_BUILD__: JSON.stringify(true),
  },
  plugins: [react()],
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
    sourcemap: false,
    emptyOutDir: true,
    reportCompressedSize: false,
  },
});
