import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { appConfig } from "./src/config/app.ts";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icon.svg", "apple-touch-icon.png"],
        manifest: {
          id: "/",
          name: `${appConfig.brand.name} — Không gian học tập`,
          short_name: appConfig.brand.name,
          description: appConfig.brand.description,
          theme_color: "#243c8f",
          background_color: "#f7fafc",
          display: "standalone",
          start_url: "/",
          scope: "/",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
          runtimeCaching: [],
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
      {
        name: "public-brand-metadata",
        transformIndexHtml: {
          order: "pre",
          handler: (html) =>
            html
              .replaceAll(
                "%APP_TITLE%",
                escapeHtml(`${appConfig.brand.name} — Không gian học tập`),
              )
              .replaceAll("%APP_LOGO%", escapeHtml(appConfig.brand.logoUrl))
              .replaceAll(
                "%APP_DESCRIPTION%",
                escapeHtml(appConfig.brand.description),
              ),
        },
      },
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
