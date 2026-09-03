import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { qrcode } from "vite-plugin-qrcode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router")) return "react-vendor";
          if (id.includes("node_modules/recharts")) return "recharts";
          if (id.includes("node_modules/leaflet") || id.includes("node_modules/react-leaflet")) return "leaflet";
          if (id.includes("node_modules/astronomy-engine")) return "astronomy";
          if (id.includes("node_modules/satellite.js")) return "satellite";
          if (id.includes("node_modules/axios") || id.includes("node_modules/swr")) return "utils";
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
