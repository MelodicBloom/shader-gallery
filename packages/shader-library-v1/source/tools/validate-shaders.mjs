import fs from "node:fs";
import path from "node:path";
import { runShader } from "./native-runner.mjs";

const root=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifest.json"),"utf8"));
let failures=0;
for (const entry of manifest.shaders) {
  const meta=JSON.parse(fs.readFileSync(path.join(root,entry.meta),"utf8"));
  try {
    const result=runShader({ entry,meta,width:128,height:128 });
    if (result.mean <= 0.5 && result.alpha <= 0.5) throw new Error("render produced no visible pixels");
    console.log(`✓ ${entry.slug} mean=${result.mean.toFixed(2)} variance=${result.variance.toFixed(2)} alpha=${result.alpha.toFixed(2)}`);
  } catch (error) {
    failures += 1;
    console.error(`✗ ${entry.slug}\n${error.message}`);
  }
}
if (failures) process.exit(1);
console.log(`Compiled, linked, and rendered ${manifest.shaders.length} WebGL2 shaders.`);
