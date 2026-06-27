import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  main: {
    build: {
      outDir: "dist-electron",
      rollupOptions: {
        external: ["active-win", "electron-store"],
      },
    },
    resolve: {
      alias: {
        "@shared": path.resolve(__dirname, "../packages/shared/src"),
      },
    },
  },
  preload: {
    build: {
      outDir: "dist-electron",
      rollupOptions: {
        external: ["active-win"],
      },
    },
    resolve: {
      alias: {
        "@shared": path.resolve(__dirname, "../packages/shared/src"),
      },
    },
  },
  renderer: {
    root: ".",
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@shared": path.resolve(__dirname, "../packages/shared/src"),
      },
    },
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
    },
  },
});
