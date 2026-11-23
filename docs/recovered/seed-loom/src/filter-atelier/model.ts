import {
  filters,
  resolveParameters,
  type FilterParameter,
  type FilterRecipe,
  type ParameterValue,
} from '@melodicbloom/svg-filter-atlas';

export const AUTHORING_RECIPE_ID = 'nacre-laminate';
export const AUTHORING_PRESET_ID = 'abalone-ridge';

export type AuthoringControl = Readonly<
  FilterParameter & {
    canonicalValue: ParameterValue;
  }
>;

export interface AuthoringModel {
  recipe: FilterRecipe;
  presetId: string;
  presetName: string;
  canonicalValues: Readonly<Record<string, ParameterValue>>;
  controls: readonly AuthoringControl[];
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function loadAuthoringModel(): AuthoringModel {
  const recipe = clone(filters.get(AUTHORING_RECIPE_ID));
  const preset = recipe.presets[AUTHORING_PRESET_ID];

  if (!preset) {
    throw new Error(
      `Missing canonical preset ${AUTHORING_PRESET_ID} for ${AUTHORING_RECIPE_ID}`,
    );
  }

  const canonicalValues = Object.freeze({
    ...resolveParameters(recipe, AUTHORING_PRESET_ID),
  });

  const controls = Object.freeze(
    recipe.parameters.map((parameter) => {
      const canonicalValue = canonicalValues[parameter.key];

      if (canonicalValue === undefined) {
        throw new Error(
          `Missing canonical value for ${parameter.key}`,
        );
      }

      return Object.freeze({
        ...clone(parameter),
        canonicalValue,
      });
    }),
  );

  return Object.freeze({
    recipe,
    presetId: AUTHORING_PRESET_ID,
    presetName: preset.name,
    canonicalValues,
    controls,
  });
}
