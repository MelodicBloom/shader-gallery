import * as React from "react";
import { compileDefinitions, compileFilter } from "./compiler.js";
import { recipes } from "./catalog.js";
import { filterUrl } from "./runtime.js";
import type { FilterSelection, ParameterValue } from "./types.js";

export interface FilterDefinitionsProps {
  include: readonly FilterSelection[];
  className?: string;
}

export function FilterDefinitions({ include, className }: FilterDefinitionsProps): unknown {
  const markup = compileDefinitions(recipes, include, { svg: false });
  return React.createElement(
    "svg",
    {
      "aria-hidden": true,
      className,
      width: 0,
      height: 0,
      style: { position: "absolute", overflow: "hidden" },
    },
    React.createElement("defs", { dangerouslySetInnerHTML: { __html: markup } }),
  );
}

export interface SvgFilterProps {
  id: string;
  recipe: string;
  preset?: string;
  parameters?: Record<string, ParameterValue>;
}

export function SvgFilter({ id, recipe, preset, parameters }: SvgFilterProps): unknown {
  const selected = recipes.find((item) => item.id === recipe);
  if (!selected) throw new Error(`Unknown recipe ${recipe}`);
  const options: { id: string; preset?: string; parameters?: Record<string, ParameterValue> } = { id };
  if (preset !== undefined) options.preset = preset;
  if (parameters !== undefined) options.parameters = parameters;
  const markup = compileFilter(selected, options);
  return React.createElement(
    "svg",
    {
      "aria-hidden": true,
      width: 0,
      height: 0,
      style: { position: "absolute", overflow: "hidden" },
    },
    React.createElement("defs", { dangerouslySetInnerHTML: { __html: markup } }),
  );
}

export { filterUrl };
