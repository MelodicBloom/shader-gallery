import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const recipesRoot = join(root, "recipes");

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

const files = (await walk(recipesRoot)).sort();
const recipes = await Promise.all(files.map(async (path) => JSON.parse(await readFile(path, "utf8"))));
recipes.sort((a, b) => a.id.localeCompare(b.id));
await mkdir(join(root, "src", "generated"), { recursive: true });
await writeFile(
  join(root, "src", "generated", "catalog.ts"),
  `// Generated from recipes/*.json. Do not edit directly.
export const recipeCatalog = ${JSON.stringify(recipes, null, 2)} as const;
`,
);
console.log(`Generated TypeScript catalog with ${recipes.length} recipes.`);
