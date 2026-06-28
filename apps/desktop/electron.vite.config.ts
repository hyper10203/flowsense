import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { copyFileSync } from "node:fs";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ["@flowsense/shared"] })],
    build: {
      lib: {
        entry: "electron/main.ts",
        formats: ["es"],
        fileName: () => "main.js",
      },
    },
    resolve: {
      alias: {
        "@flowsense/shared": resolve(__dirname, "../../packages/shared/src/index.ts"),
        "@shared": resolve(__dirname, "../../packages/shared/src"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: ["@flowsense/shared"] })],
    build: {
      lib: {
        entry: "electron/preload.ts",
        formats: ["es"],
        fileName: () => "preload.mjs",
      },
    },
    resolve: {
      alias: {
        "@flowsense/shared": resolve(__dirname, "../../packages/shared/src/index.ts"),
        "@shared": resolve(__dirname, "../../packages/shared/src"),
      },
    },
  },
  renderer: {
    root: ".",
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: { input: { index: "index.html" } },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
        "@shared": resolve(__dirname, "../../packages/shared/src"),
      },
    },
    plugins: [
      react(),
      {
        name: "copy-overlay-html",
        writeBundle() {
          try {
            copyFileSync(
              resolve(__dirname, "overlay.html"),
              resolve(__dirname, "dist", "overlay.html")
            );
          } catch {
            // not present in dev — dev server serves it directly
          }
        },
      },
    ],
    server: { port: 5173, strictPort: true },
  },
});
