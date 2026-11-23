import { compileDefinitions, compileFilter, staticFilterId } from "./compiler.js";
import { recipes } from "./catalog.js";
import type { CompileOptions, FilterFamily, FilterRecipe, FilterSelection } from "./types.js";

function getRecipe(id: string): FilterRecipe {
  const recipe = recipes.find((item) => item.id === id);
  if (!recipe) throw new Error(`Unknown SVG filter recipe: ${id}`);
  return recipe;
}

export const filters = Object.freeze({
  list(options: { family?: FilterFamily; status?: FilterRecipe["status"] } = {}): readonly FilterRecipe[] {
    return recipes.filter((recipe) =>
      (!options.family || recipe.family === options.family) &&
      (!options.status || recipe.status === options.status),
    );
  },
  get: getRecipe,
  getPreset(recipeId: string, preset: string) {
    const recipe = getRecipe(recipeId);
    const selected = recipe.presets[preset];
    if (!selected) throw new Error(`Unknown preset ${preset} for ${recipeId}`);
    return selected;
  },
  compile(recipeId: string, options: CompileOptions = {}): string {
    return compileFilter(getRecipe(recipeId), options);
  },
  definitions(selections: readonly FilterSelection[]): string {
    return compileDefinitions(recipes, selections);
  },
});

export function filterUrl(recipeId: string, preset?: string, prefix = "mb"): string {
  getRecipe(recipeId);
  if (preset) filters.getPreset(recipeId, preset);
  return `url("#${staticFilterId(recipeId, preset, prefix)}")`;
}
