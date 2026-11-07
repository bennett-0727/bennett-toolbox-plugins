import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const OUT = path.join(DIST, "zips");
fs.mkdirSync(OUT, { recursive: true });

const buildInfo = [];
for (const id of fs.readdirSync(DIST)) {
  const pluginDir = path.join(DIST, id);
  if (!fs.statSync(pluginDir).isDirectory() || id === "zips") continue;
  for (const version of fs.readdirSync(pluginDir)) {
    const versionDir = path.join(pluginDir, version);
    if (!fs.statSync(versionDir).isDirectory()) continue;
    const manifestPath = path.join(versionDir, "plugin.json");
    const mainPath = path.join(versionDir, "main.js");
    if (!fs.existsSync(manifestPath) || !fs.existsSync(mainPath)) {
      throw new Error(`Incomplete build: ${versionDir}`);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const zip = new JSZip();
    for (const file of fs.readdirSync(versionDir)) {
      const full = path.join(versionDir, file);
      if (fs.statSync(full).isFile()) zip.file(file, fs.readFileSync(full));
    }
    const filename = `${manifest.id}-${manifest.version}.zip`;
    const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    fs.writeFileSync(path.join(OUT, filename), buffer);
    buildInfo.push({
      manifest,
      filename,
      size: buffer.byteLength,
      sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
    });
    console.log(`packed ${filename} (${buffer.byteLength} bytes)`);
  }
}
fs.writeFileSync(path.join(DIST, "build-info.json"), JSON.stringify(buildInfo, null, 2));
