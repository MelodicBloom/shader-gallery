import './isolation.css';

import {
  compileFilter,
  type FilterRecipe,
  type ParameterValue,
} from '@melodicbloom/svg-filter-atlas';

const PREVIEW_FILTER_ID = 'seed-loom-atelier-preview';

export function renderPreview(
  recipe: FilterRecipe,
  values: Readonly<Record<string, ParameterValue>>,
  definitionsHost: HTMLElement,
  surface: HTMLElement,
): void {
  const filter = compileFilter(recipe, {
    id: PREVIEW_FILTER_ID,
    parameters: { ...values },
    includePrimitiveIds: true,
  });

  definitionsHost.innerHTML = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      width="0"
      height="0"
      style="position:absolute;overflow:hidden"
    >
      <defs>${filter}</defs>
    </svg>
  `;

  surface.style.filter = `url("#${PREVIEW_FILTER_ID}")`;
}

export function clearPreview(
  definitionsHost: HTMLElement,
  surface: HTMLElement,
): void {
  definitionsHost.replaceChildren();
  surface.style.removeProperty('filter');
}
