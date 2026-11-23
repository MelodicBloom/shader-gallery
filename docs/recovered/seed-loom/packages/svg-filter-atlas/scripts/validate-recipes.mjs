import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const recipesRoot = join(root, "recipes");
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.name.endsWith(".json")) files.push(path);
  }
  return files;
}
function flatten(nodes) { return nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]); }

const errors = [];
const seenRecipeIds = new Set();
for (const file of await walk(recipesRoot)) {
  const recipe = JSON.parse(await readFile(file, "utf8"));
  if (!idPattern.test(recipe.id)) errors.push(`${file}: invalid recipe id`);
  if (seenRecipeIds.has(recipe.id)) errors.push(`${file}: duplicate recipe id ${recipe.id}`);
  seenRecipeIds.add(recipe.id);
  const nodes = flatten(recipe.primitives ?? []);
  const ids = new Set();
  for (const node of nodes) {
    if (ids.has(node.id)) errors.push(`${file}: duplicate primitive id ${node.id}`);
    ids.add(node.id);
  }
  if (recipe.performance?.primitiveCount !== recipe.primitives.length) {
    errors.push(`${file}: performance.primitiveCount must equal top-level primitive count (${recipe.primitives.length})`);
  }
  const parameterKeys = new Set((recipe.parameters ?? []).map((parameter) => parameter.key));
  for (const parameter of recipe.parameters ?? []) {
    const target = nodes.find((node) => node.id === parameter.binding?.primitiveId);
    if (!target) errors.push(`${file}: ${parameter.key} targets unknown primitive`);
    else if (!(parameter.binding.attribute in target.attributes)) errors.push(`${file}: ${parameter.key} targets unknown attribute`);
  }
  for (const [preset, data] of Object.entries(recipe.presets ?? {})) {
    if (!idPattern.test(preset)) errors.push(`${file}: invalid preset key ${preset}`);
    for (const key of Object.keys(data.values ?? {})) {
      if (!parameterKeys.has(key)) errors.push(`${file}: preset ${preset} references unknown parameter ${key}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Validated ${seenRecipeIds.size} recipes with no structural errors.`);
