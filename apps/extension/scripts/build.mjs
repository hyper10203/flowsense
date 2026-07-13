/* Copy src/ into dist/ for Chrome to load. Copies JSON/CSS/HTML verbatim; rewrites
   .ts -> .js by Node's experimental strip-types flag or transpiles via tsc. */

import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const src = resolve(root, "src");
const dist = resolve(root, "dist");

async function build() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });

  await cp(src, dist, { recursive: true });

  const tsFiles = execSync(
    'node -e "console.log(require(\'node:fs\').readdirSync(\'dist\',{recursive:true}).filter(f=>String(f).endsWith(\'.ts\')).join(\'\\n\'))"',
    { encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean);

  for (const file of tsFiles) {
    const distPath = resolve(dist, file);
    execSync(`npx tsc --outDir dist --skipLibCheck --module esnext --target es2022 --moduleResolution bundler ${distPath}`);
    await rm(distPath);
  }

}

async function main() {
  const watchMode = process.argv.includes("--watch");
  await build();
  if (!watchMode) return;

  const { watch } = await import("node:fs");
  let timer;
  watch(src, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void build().catch(console.error);
    }, 200);
  });
  console.log("Watching extension/src...");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
