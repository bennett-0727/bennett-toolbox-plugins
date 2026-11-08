import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const ROOT = path.resolve(import.meta.dirname, "..");
const PLUGINS = path.join(ROOT, "plugins");
const SHARED = path.join(ROOT, "shared");
const OUT = path.join(ROOT, "dist");

function resolveShared(name) {
  const base = path.join(SHARED, name);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Cannot resolve @shared/${name}`);
}

const sharedPlugin = {
  name: "bennett-shared",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^@shared\// }, (args) => ({
      path: resolveShared(args.path.slice("@shared/".length)),
    }));
    buildApi.onResolve({ filter: /^react\/jsx(-dev)?-runtime$/ }, (args) => {
      if (args.importer.includes(`${path.sep}node_modules${path.sep}`)) return null;
      if (args.importer.includes(`${path.sep}shared${path.sep}i18n${path.sep}`)) return null;
      return {
        path: path.join(SHARED, "i18n", args.path.endsWith("dev-runtime") ? "jsx-dev-runtime.ts" : "jsx-runtime.ts"),
      };
    });
  },
};

for (const dir of fs.readdirSync(PLUGINS)) {
  const pluginDir = path.join(PLUGINS, dir);
  const manifestPath = path.join(pluginDir, "plugin.json");
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const entry = path.join(pluginDir, "src/index.tsx");
  if (!fs.existsSync(entry)) throw new Error(`Missing entry for ${dir}`);
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
    plugins: [sharedPlugin],
    loader: { ".svg": "dataurl", ".png": "dataurl", ".css": "text" },
  });
  fs.copyFileSync(manifestPath, path.join(outDir, "plugin.json"));
  for (const file of ["README.md", "icon.svg"]) {
    const source = path.join(pluginDir, file);
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(outDir, file));
  }
  if (manifest.id === "bennett.pdf-to-images") {
    fs.copyFileSync(
      path.join(ROOT, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs"),
      path.join(outDir, "pdf.worker.min.mjs"),
    );
  }
  console.log(`built ${manifest.id}@${manifest.version}`);
}
