import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  compileDefinitions,
  compileFilter,
  filterUrl,
  filters,
  recipes,
  resolveParameters,
  validateRecipe,
} from "../dist/index.js";
import {
  DEFAULT_GENERATED_AT,
  resolveGeneratedAt,
} from "../scripts/reproducible-time.mjs";

function isStepAligned(value, parameter) {
  if (parameter.step === undefined) return true;
  const origin = parameter.min ?? 0;
  const quotient = (value - origin) / parameter.step;
  return Math.abs(quotient - Math.round(quotient)) < 1e-8;
}

test("catalog contains the eight signature recipes", () => {
  assert.equal(recipes.length, 8);
  assert.equal(recipes.reduce((sum, recipe) => sum + Object.keys(recipe.presets).length, 0), 24);
});

test("every recipe passes runtime validation", () => {
  for (const recipe of recipes) assert.deepEqual(validateRecipe(recipe), []);
});

test("governed abalone authoring values align with declared steps", () => {
  const recipe = filters.get("nacre-laminate");
  const preset = recipe.presets["abalone-ridge"];
  assert.ok(preset);

  for (const parameter of recipe.parameters) {
    const value = preset.values[parameter.key];
    if (typeof value !== "number") continue;
    assert.equal(
      isStepAligned(value, parameter),
      true,
      `nacre-laminate.abalone-ridge.${parameter.key} is off-step`,
    );
  }
});

test("a named preset resolves over defaults", () => {
  const recipe = filters.get("nacre-laminate");
  const resolved = resolveParameters(recipe, "abalone-ridge");
  assert.equal(resolved["surface-scale"], 6.5);
  assert.equal(resolved["specular-exponent"], 38);
  assert.equal(resolved.azimuth, 250);
});

test("compiler binds vector components and namespaces the filter", () => {
  const recipe = filters.get("washi-fiber");
  const svg = compileFilter(recipe, { id: "card-7--washi", parameters: { "fiber-x": 0.01 } });
  assert.match(svg, /id="card-7--washi"/);
  assert.match(svg, /baseFrequency="0.01 0.48"/);
});

test("definitions compile multiple recipes", () => {
  const svg = compileDefinitions(recipes, [
    { recipe: "nacre-laminate", preset: "pearl-calm" },
    { recipe: "brass-inlay", preset: "polished-inlay" },
  ]);
  assert.match(svg, /mb--nacre-laminate--pearl-calm/);
  assert.match(svg, /mb--brass-inlay--polished-inlay/);
});

test("runtime filter URLs use stable static IDs", () => {
  assert.equal(filterUrl("marble-vein", "calacatta-bold"), 'url("#mb--marble-vein--calacatta-bold")');
});

test("registry timestamps are reproducible", () => {
  assert.equal(resolveGeneratedAt(), DEFAULT_GENERATED_AT);
  assert.equal(resolveGeneratedAt("0"), "1970-01-01T00:00:00.000Z");
  assert.equal(resolveGeneratedAt("1784678400"), "2026-07-22T00:00:00.000Z");
  assert.throws(
    () => resolveGeneratedAt("not-a-number"),
    /SOURCE_DATE_EPOCH must be a non-negative integer/,
  );
});

test("generated registry and definition bundle are consistent", async () => {
  const registry = JSON.parse(await readFile(new URL("../generated/registry.json", import.meta.url), "utf8"));
  const definitions = await readFile(new URL("../generated/definitions.svg", import.meta.url), "utf8");
  assert.equal(registry.generatedAt, DEFAULT_GENERATED_AT);
  assert.equal(registry.recipeCount, 8);
  assert.equal(registry.presetCount, 24);
  assert.match(definitions, /mb--guanine-crystal--excited-spectrum/);
});
