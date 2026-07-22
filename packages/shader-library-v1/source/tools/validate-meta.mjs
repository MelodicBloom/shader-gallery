import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root,"manifest.json"),"utf8"));
let failures=0;
for (const entry of manifest.shaders) {
  const file=path.join(root,entry.meta);
  try {
    const meta=JSON.parse(fs.readFileSync(file,"utf8"));
    for (const key of ["schemaVersion","name","slug","renderer","uniforms","preview"]) if (!(key in meta)) throw new Error(`missing ${key}`);
    if (meta.slug !== entry.slug) throw new Error(`slug mismatch: ${meta.slug}`);
    console.log(`✓ ${entry.slug}`);
  } catch (error) {
    failures += 1;
    console.error(`✗ ${entry.slug}: ${error.message}`);
  }
}
if (failures) process.exit(1);
console.log(`Validated ${manifest.shaders.length} metadata files.`);
