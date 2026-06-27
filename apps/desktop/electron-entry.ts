// Wrapper entry to avoid Rollup's "entry module cannot be external" error.
// electron.main.ts imports `electron` which must be external, but Rollup
// refuses to externalize the entry module itself. This wrapper re-exports
// the actual main process so the entry has no external imports.
import "./electron/main.ts";
