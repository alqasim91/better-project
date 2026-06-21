import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

// Build with VITE_LOCAL_AI=true to produce a single self-contained HTML
// that talks to LM Studio instead of the Netlify Functions.
const isLocalBuild = process.env.VITE_LOCAL_AI === "true";

export default defineConfig({
  plugins: [react(), ...(isLocalBuild ? [viteSingleFile()] : [])],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: isLocalBuild
    ? {
        outDir: "dist-local",
        assetsInlineLimit: 100_000_000,
        chunkSizeWarningLimit: 100_000_000,
        cssCodeSplit: false,
        rollupOptions: {
          output: { inlineDynamicImports: true },
        },
      }
    : {},
});
