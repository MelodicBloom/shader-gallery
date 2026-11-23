import type {
  CompileOptions,
  FilterRecipe,
  FilterSelection,
  ParameterValue,
  PrimitiveNode,
} from "./types.js";
import { assertValidRecipe } from "./validation.js";

const XML_NAME = /^[A-Za-z_][A-Za-z0-9_.:-]*$/;

function escapeXml(value: ParameterValue): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function cloneNodes(nodes: PrimitiveNode[]): PrimitiveNode[] {
  return nodes.map((node) => {
    const cloned: PrimitiveNode = {
      id: node.id,
      type: node.type,
      attributes: { ...node.attributes },
    };
    if (node.children) cloned.children = cloneNodes(node.children);
    return cloned;
  });
}

function findPrimitive(nodes: PrimitiveNode[], id: string): PrimitiveNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const nested = findPrimitive(node.children ?? [], id);
    if (nested) return nested;
  }
  return undefined;
}

function normalizeTokenString(value: ParameterValue, component: number, next: ParameterValue): string {
  const tokens = String(value).trim().split(/\s+/);
  if (component >= tokens.length) {
    throw new Error(`Cannot set component ${component}; attribute only has ${tokens.length} token(s)`);
  }
  tokens[component] = String(next);
  return tokens.join(" ");
}

export function resolveParameters(
  recipe: FilterRecipe,
  preset?: string,
  overrides: Record<string, ParameterValue> = {},
): Record<string, ParameterValue> {
  const resolved = Object.fromEntries(recipe.parameters.map((parameter) => [parameter.key, parameter.default]));
  if (preset) {
    const selected = recipe.presets[preset];
    if (!selected) throw new Error(`Unknown preset "${preset}" for ${recipe.id}`);
    Object.assign(resolved, selected.values);
  }
  Object.assign(resolved, overrides);

  for (const parameter of recipe.parameters) {
    const value = resolved[parameter.key];
    if (value === undefined) throw new Error(`Missing parameter ${parameter.key}`);
    if (typeof value === "number") {
      if (parameter.min !== undefined && value < parameter.min) throw new RangeError(`${parameter.key} is below ${parameter.min}`);
      if (parameter.max !== undefined && value > parameter.max) throw new RangeError(`${parameter.key} is above ${parameter.max}`);
      if (parameter.type === "integer" && !Number.isInteger(value)) throw new TypeError(`${parameter.key} must be an integer`);
    }
  }
  return resolved;
}

export function resolveRecipe(
  recipe: FilterRecipe,
  preset?: string,
  overrides: Record<string, ParameterValue> = {},
): { nodes: PrimitiveNode[]; parameters: Record<string, ParameterValue> } {
  assertValidRecipe(recipe);
  const nodes = cloneNodes(recipe.primitives);
  const parameters = resolveParameters(recipe, preset, overrides);
  for (const parameter of recipe.parameters) {
    const target = findPrimitive(nodes, parameter.binding.primitiveId);
    if (!target) throw new Error(`Unknown primitive ${parameter.binding.primitiveId}`);
    const value = parameters[parameter.key];
    if (value === undefined) throw new Error(`Missing resolved parameter ${parameter.key}`);
    if (parameter.binding.component === undefined) {
      target.attributes[parameter.binding.attribute] = value;
    } else {
      const current = target.attributes[parameter.binding.attribute];
      if (current === undefined) throw new Error(`Missing attribute ${parameter.binding.attribute}`);
      target.attributes[parameter.binding.attribute] = normalizeTokenString(
        current,
        parameter.binding.component,
        value,
      );
    }
  }
  return { nodes, parameters };
}

function renderNode(node: PrimitiveNode, filterId: string, includePrimitiveIds: boolean): string {
  if (!XML_NAME.test(node.type)) throw new Error(`Unsafe SVG primitive name: ${node.type}`);
  const attributes: Record<string, ParameterValue> = { ...node.attributes };
  if (includePrimitiveIds) attributes.id = `${filterId}--${node.id}`;
  const attrText = Object.entries(attributes)
    .map(([key, value]) => `${key}="${escapeXml(value)}"`)
    .join(" ");
  if (!node.children?.length) return `<${node.type}${attrText ? ` ${attrText}` : ""}/>`;
  return `<${node.type}${attrText ? ` ${attrText}` : ""}>${node.children
    .map((child) => renderNode(child, filterId, includePrimitiveIds))
    .join("")}</${node.type}>`;
}

export function staticFilterId(recipeId: string, preset?: string, prefix = "mb"): string {
  return [prefix, recipeId, preset].filter(Boolean).join("--");
}

export function compileFilter(recipe: FilterRecipe, options: CompileOptions = {}): string {
  const filterId = options.id ?? staticFilterId(recipe.id, options.preset, options.prefix ?? "mb");
  if (!XML_NAME.test(filterId)) throw new Error(`Unsafe filter id: ${filterId}`);
  const { nodes } = resolveRecipe(recipe, options.preset, options.parameters);
  const region = recipe.filterRegion;
  const attrs = [
    `id="${escapeXml(filterId)}"`,
    `x="${escapeXml(region.x)}"`,
    `y="${escapeXml(region.y)}"`,
    `width="${escapeXml(region.width)}"`,
    `height="${escapeXml(region.height)}"`,
    `color-interpolation-filters="${recipe.colorInterpolation}"`,
  ].join(" ");
  return `<filter ${attrs}>${nodes.map((node) => renderNode(node, filterId, options.includePrimitiveIds ?? false)).join("")}</filter>`;
}

export function compileDefinitions(
  recipes: readonly FilterRecipe[],
  selections: readonly FilterSelection[],
  options: { svg?: boolean; prefix?: string } = {},
): string {
  const filters = selections.map((selection) => {
    const recipe = recipes.find((item) => item.id === selection.recipe);
    if (!recipe) throw new Error(`Unknown recipe ${selection.recipe}`);
    const compileOptions: CompileOptions = {};
    if (selection.preset !== undefined) compileOptions.preset = selection.preset;
    if (selection.parameters !== undefined) compileOptions.parameters = selection.parameters;
    if (selection.id !== undefined) compileOptions.id = selection.id;
    if (options.prefix !== undefined) compileOptions.prefix = options.prefix;
    return compileFilter(recipe, compileOptions);
  });
  const defs = `<defs>${filters.join("")}</defs>`;
  return options.svg === false
    ? filters.join("")
    : `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="0" height="0" style="position:absolute;overflow:hidden">${defs}</svg>`;
}
