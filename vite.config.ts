import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { qrcode } from "vite-plugin-qrcode";

export default defineConfig({
  plugins: [react(), tailwindcss(), qrcode()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  /* Production optimizations */
  build: {
    target: "es2022",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          utils: ["axios", "swr"],
        },
      },
    },
  },

  /* Development optimizations */
  server: {
    port: 3000,
    strictPort: false,
    open: true,

  },

  /* Preview optimizations */
  preview: {
    port: 4173,
    strictPort: false,
  },
});
