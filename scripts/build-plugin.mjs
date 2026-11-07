import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const ROOT = path.resolve(import.meta.dirname, "..");
const PLUGINS = path.join(ROOT, "plugins");
const OUT = path.join(ROOT, "dist");

for (const id of fs.readdirSync(PLUGINS)) {
  const pluginDir = path.join(PLUGINS, id);
  const manifestPath = path.join(pluginDir, "plugin.json");
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const entry = path.join(pluginDir, "src/index.tsx");
  if (!fs.existsSync(entry)) throw new Error(`Missing entry for ${id}`);
  const outDir = path.join(OUT, manifest.id, manifest.version);
  fs.mkdirSync(outDir, { recursive: true });
  await build({
    entryPoints: [entry],
    outfile: path.join(outDir, "main.js"),
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["chrome120"],
    jsx: "automatic",
    minify: true,
    sourcemap: false,
    define: { "process.env.NODE_ENV": '"production"' },
    loader: { ".svg": "dataurl", ".png": "dataurl" },
  });
  fs.copyFileSync(manifestPath, path.join(outDir, "plugin.json"));
  for (const file of ["README.md", "icon.svg"]) {
    const source = path.join(pluginDir, file);
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(outDir, file));
  }
  console.log(`built ${manifest.id}@${manifest.version}`);
}
