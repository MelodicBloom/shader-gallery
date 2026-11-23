import type { ParameterValue } from '@melodicbloom/svg-filter-atlas';
import type { AuthoringModel } from './model';

interface CandidateDocument {
  schema: 'melodicbloom.svg-filter-preset-candidate/0.1';
  recipe: {
    id: string;
    version: string;
  };
  sourcePreset: string;
  candidate: {
    id: string;
    name: string;
    description: string;
    values: Record<string, ParameterValue>;
  };
  governance: {
    status: 'draft';
    canonicalMutation: false;
    requiresHumanReview: true;
  };
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);

  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortDeep(nested)]),
    );
  }

  return value;
}

export function createCandidateDocument(
  model: AuthoringModel,
  values: Readonly<Record<string, ParameterValue>>,
): CandidateDocument {
  const orderedValues = Object.fromEntries(
    model.controls
      .map((parameter) => {
        const value = values[parameter.key];

        if (value === undefined) {
          throw new Error(
            `Candidate value missing for ${parameter.key}`,
          );
        }

        return [parameter.key, value] as const;
      })
      .sort(([left], [right]) => left.localeCompare(right)),
  );

  return {
    schema: 'melodicbloom.svg-filter-preset-candidate/0.1',
    recipe: {
      id: model.recipe.id,
      version: model.recipe.version,
    },
    sourcePreset: model.presetId,
    candidate: {
      id: `${model.presetId}-candidate`,
      name: `${model.presetName} Candidate`,
      description:
        'Unapproved candidate exported from the governed Seed-Loom atelier.',
      values: orderedValues,
    },
    governance: {
      status: 'draft',
      canonicalMutation: false,
      requiresHumanReview: true,
    },
  };
}

export function serializeCandidate(
  model: AuthoringModel,
  values: Readonly<Record<string, ParameterValue>>,
): string {
  return (
    JSON.stringify(
      sortDeep(createCandidateDocument(model, values)),
      null,
      2,
    ) + '\n'
  );
}

export function downloadCandidate(
  model: AuthoringModel,
  values: Readonly<Record<string, ParameterValue>>,
): void {
  const content = serializeCandidate(model, values);
  const blob = new Blob([content], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download =
    `${model.recipe.id}--${model.presetId}--candidate.json`;
  anchor.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
