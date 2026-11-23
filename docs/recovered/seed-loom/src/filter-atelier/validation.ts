import {
  resolveParameters,
  validateRecipe,
  type FilterParameter,
  type FilterRecipe,
  type ParameterValue,
} from '@melodicbloom/svg-filter-atlas';
import type { AuthoringModel } from './model';

export interface DraftIssue {
  path: string;
  message: string;
}

export interface DraftValidation {
  valid: boolean;
  issues: readonly DraftIssue[];
}

function isStepAligned(
  value: number,
  parameter: FilterParameter,
): boolean {
  if (parameter.step === undefined) return true;
  const origin = parameter.min ?? 0;
  const quotient = (value - origin) / parameter.step;
  return Math.abs(quotient - Math.round(quotient)) < 1e-8;
}

function candidateRecipe(
  model: AuthoringModel,
  values: Readonly<Record<string, ParameterValue>>,
): FilterRecipe {
  const recipe = structuredClone(model.recipe);
  recipe.presets = {
    ...recipe.presets,
    'atelier-candidate': {
      name: 'Atelier Candidate',
      description:
        'Unapproved browser-local candidate used only for validation.',
      values: { ...values },
    },
  };
  return recipe;
}

function normalizeRecipeIssue(issue: DraftIssue): DraftIssue {
  const candidatePrefix = 'presets.atelier-candidate.values.';
  if (issue.path.startsWith(candidatePrefix)) {
    return {
      path: `values.${issue.path.slice(candidatePrefix.length)}`,
      message: issue.message,
    };
  }
  return issue;
}

function pushIssue(
  issues: DraftIssue[],
  path: string,
  message: string,
): void {
  if (issues.some((issue) => issue.path === path && issue.message === message)) {
    return;
  }
  issues.push({ path, message });
}

function validateValue(
  issues: DraftIssue[],
  parameter: FilterParameter,
  value: ParameterValue,
): void {
  const path = `values.${parameter.key}`;

  if (
    (parameter.type === 'number' || parameter.type === 'integer') &&
    (typeof value !== 'number' || !Number.isFinite(value))
  ) {
    pushIssue(issues, path, 'must be a finite number');
    return;
  }

  if (parameter.type === 'integer' && !Number.isInteger(value)) {
    pushIssue(issues, path, 'must be an integer');
    return;
  }

  if (parameter.type === 'boolean' && typeof value !== 'boolean') {
    pushIssue(issues, path, 'must be true or false');
    return;
  }

  if (parameter.type === 'color') {
    if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) {
      pushIssue(issues, path, 'must be a six-digit hex color');
    }
    return;
  }

  if (typeof value !== 'number') return;

  if (parameter.min !== undefined && value < parameter.min) {
    pushIssue(issues, path, `must be at least ${parameter.min}`);
  }
  if (parameter.max !== undefined && value > parameter.max) {
    pushIssue(issues, path, `must be no more than ${parameter.max}`);
  }
  if (!isStepAligned(value, parameter)) {
    pushIssue(
      issues,
      path,
      `must align to ${parameter.step}${parameter.unit === 'deg' ? '°' : parameter.unit ?? ''} increments`,
    );
  }
}

export function validateDraft(
  model: AuthoringModel,
  values: Readonly<Record<string, ParameterValue>>,
): DraftValidation {
  const issues: DraftIssue[] = [];
  const expectedKeys = new Set(
    model.controls.map((parameter) => parameter.key),
  );

  for (const key of Object.keys(values)) {
    if (!expectedKeys.has(key)) {
      pushIssue(
        issues,
        `values.${key}`,
        'is not declared by the canonical recipe',
      );
    }
  }

  for (const parameter of model.controls) {
    const value = values[parameter.key];

    if (value === undefined) {
      pushIssue(issues, `values.${parameter.key}`, 'is required');
      continue;
    }

    validateValue(issues, parameter, value);
  }

  if (issues.length === 0) {
    try {
      resolveParameters(model.recipe, undefined, { ...values });
    } catch (error) {
      pushIssue(
        issues,
        'values',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  for (const issue of validateRecipe(candidateRecipe(model, values))) {
    const normalized = normalizeRecipeIssue(issue);
    pushIssue(issues, normalized.path, normalized.message);
  }

  return Object.freeze({
    valid: issues.length === 0,
    issues: Object.freeze(issues),
  });
}
