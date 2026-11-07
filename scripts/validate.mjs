import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const registry = JSON.parse(fs.readFileSync(path.join(DIST, "registry.json"), "utf8"));
const ids = new Set();

if (registry.schemaVersion !== 1 || !Array.isArray(registry.plugins)) {
  throw new Error("Invalid registry");
}
for (const plugin of registry.plugins) {
  if (!/^[a-z0-9]+(\.[a-z0-9-]+)+$/.test(plugin.id)) throw new Error(`Bad id: ${plugin.id}`);
  if (ids.has(plugin.id)) throw new Error(`Duplicate id: ${plugin.id}`);
  ids.add(plugin.id);
  if (!/^\d+\.\d+\.\d+$/.test(plugin.version)) throw new Error(`Bad version: ${plugin.version}`);
  if (plugin.apiVersion !== 1) throw new Error(`Bad apiVersion: ${plugin.id}`);
  if (!plugin.downloadUrl.startsWith("https://github.com/")) throw new Error(`Bad URL: ${plugin.id}`);
  const zipPath = path.join(DIST, "zips", `${plugin.id}-${plugin.version}.zip`);
  if (!fs.existsSync(zipPath)) throw new Error(`Missing zip: ${zipPath}`);
  const buffer = fs.readFileSync(zipPath);
  if (buffer.byteLength !== plugin.size) throw new Error(`Size mismatch: ${plugin.id}`);
  const sha = crypto.createHash("sha256").update(buffer).digest("hex");
  if (sha !== plugin.sha256) throw new Error(`SHA mismatch: ${plugin.id}`);
}
console.log(`validated ${registry.plugins.length} plugin(s)`);
