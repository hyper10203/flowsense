// Wrapper entry to avoid Rollup's "entry module cannot be external" error.
// The electron-vite preset hardcodes `electron` in rollupOptions.external,
// which prevents the entry module from importing `electron`.
// This wrapper uses dynamic import so the entry itself has no external imports.
await import("./electron/main.ts");
