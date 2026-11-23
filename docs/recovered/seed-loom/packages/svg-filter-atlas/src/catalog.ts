import { recipeCatalog } from "./generated/catalog.js";
import type { FilterRecipe } from "./types.js";

export const recipes = recipeCatalog as unknown as readonly FilterRecipe[];
