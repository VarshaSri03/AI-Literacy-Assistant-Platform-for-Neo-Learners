import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// CHANGED from your original: added the VitePWA plugin. Everything else
// (React plugin, dev server port/strictPort) is exactly what you had.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Precaches your built JS/CSS/HTML so the app shell loads offline.
      // Deliberately does NOT touch API calls (/api/*) — those stay live,
      // network-only, so lessons/auth/AI help never serve stale/cached
      // data. This is exactly the caution Part 15 of the spec asked for.
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        navigateFallbackDenylist: [/^\/api\//],
      },
      includeAssets: ["favicon.png"],
      manifest: {
        name: "Learnly",
        short_name: "Learnly",
        description: "AI-powered multilingual literacy and language learning platform",
        display: "standalone",
        start_url: "/",
        scope: "/",
        theme_color: "#6C3CEB",
        background_color: "#F8F7FF",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
});
