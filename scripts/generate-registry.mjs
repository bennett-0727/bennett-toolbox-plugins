import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const REPO = process.env.PLUGIN_REPO || "bennett-0727/bennett-toolbox-plugins";
const TAG = process.env.PLUGIN_RELEASE_TAG || "plugin-v1.0.0";
const buildInfo = JSON.parse(fs.readFileSync(path.join(DIST, "build-info.json"), "utf8"));

const plugins = buildInfo.map(({ manifest, filename, size, sha256 }) => ({
  ...manifest,
  downloadUrl: `https://github.com/${REPO}/releases/download/${TAG}/${filename}`,
  size,
  sha256,
}));

const registry = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  plugins,
};
fs.writeFileSync(path.join(DIST, "registry.json"), JSON.stringify(registry, null, 2));
console.log(`registry.json: ${plugins.length} plugin(s), tag ${TAG}`);
