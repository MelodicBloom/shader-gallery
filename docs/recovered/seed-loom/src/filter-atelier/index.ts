import './styles.css';
import {
  createControl,
  readControlValue,
  setControlIssue,
  writeControlValue,
  type ControlElements,
} from './controls';
import { downloadCandidate, serializeCandidate } from './export';
import { loadAuthoringModel } from './model';
import { renderPreview } from './preview';
import { DraftStore } from './state';
import { validateDraft } from './validation';

interface SiteSurfaceState {
  element: HTMLElement;
  inert: boolean;
  ariaHidden: string | null;
}

function renderIssues(
  host: HTMLElement,
  issues: readonly { path: string; message: string }[],
): void {
  host.replaceChildren();

  if (issues.length === 0) {
    host.dataset.valid = 'true';
    host.textContent = 'Valid draft · candidate export enabled.';
    return;
  }

  host.dataset.valid = 'false';
  const summary = document.createElement('strong');
  summary.textContent = `${issues.length} validation ${issues.length === 1 ? 'issue' : 'issues'}`;

  const list = document.createElement('ul');
  list.className = 'filter-atelier__issues';

  for (const issue of issues) {
    const item = document.createElement('li');
    item.textContent = `${issue.path}: ${issue.message}`;
    list.append(item);
  }

  host.append(summary, list);
}

function polishSiteCopy(): void {
  const actions: Readonly<Record<string, string>> = {
    Seed: 'Explore public references',
    Garden: 'Open private compiler',
    Conservatory: 'Review validation workflow',
    Biome: 'Inspect governance controls',
  };

  for (const plan of document.querySelectorAll<HTMLElement>('.plan')) {
    const name = plan.querySelector('h3')?.textContent?.trim();
    const button = plan.querySelector<HTMLButtonElement>('button');
    if (name && button && actions[name]) button.textContent = actions[name];
  }
}

export function mountFilterAtelier(): void {
  if (document.querySelector('#filter-atelier')) return;

  polishSiteCopy();

  const model = loadAuthoringModel();
  const store = new DraftStore(model);
  const section = document.createElement('section');
  section.id = 'filter-atelier';
  section.className = 'filter-atelier';
  section.hidden = true;
  section.tabIndex = -1;
  section.setAttribute('aria-labelledby', 'filter-atelier-title');

  section.innerHTML = `
    <header class="filter-atelier__header">
      <div>
        <p class="filter-atelier__kicker">SVG Filter Atelier · governed v0.2</p>
        <h1 id="filter-atelier-title">Shape the material. Preserve the source.</h1>
        <p class="filter-atelier__lede">
          Edit one review-required draft while the approved recipe remains locked,
          traceable, and unchanged.
        </p>
      </div>
      <button
        class="filter-atelier__close"
        type="button"
        data-atelier-close
        aria-label="Close filter atelier"
      >
        Close
      </button>
    </header>

    <div class="filter-atelier__body">
      <div class="filter-atelier__source-bar">
        <span class="filter-atelier__lock">Canonical source · locked</span>
        <strong>${model.recipe.name} / ${model.presetName}</strong>
        <span class="filter-atelier__draft-badge" data-atelier-dirty>Canonical</span>
      </div>

      <div class="filter-atelier__workspace">
        <article class="filter-atelier__panel filter-atelier__preview-panel">
          <div class="filter-atelier__status-line">
            <div>
              <p class="filter-atelier__panel-kicker">Compiled material</p>
              <h2>Live preview</h2>
            </div>
            <span data-atelier-preview-note>Compiler output current</span>
          </div>

          <div class="filter-atelier__preview" data-atelier-preview>
            <div
              class="filter-atelier__preview-surface"
              data-atelier-preview-surface
              aria-label="Live nacre filter preview"
            ></div>
          </div>
          <div data-atelier-definitions></div>
          <div
            class="filter-atelier__status"
            data-atelier-validation
            aria-live="polite"
          ></div>
        </article>

        <article class="filter-atelier__panel filter-atelier__controls-panel">
          <div class="filter-atelier__panel-heading">
            <div>
              <p class="filter-atelier__panel-kicker">Draft parameters</p>
              <h2>Material controls</h2>
            </div>
            <span>${model.controls.length} governed fields</span>
          </div>
          <div class="filter-atelier__controls" data-atelier-controls></div>
        </article>
      </div>

      <details class="filter-atelier__panel filter-atelier__disclosure">
        <summary>Canonical provenance and authoring boundary</summary>
        <dl class="filter-atelier__metadata">
          <div><dt>Recipe</dt><dd>${model.recipe.id}@${model.recipe.version}</dd></div>
          <div><dt>Source preset</dt><dd>${model.presetId}</dd></div>
          <div><dt>Status</dt><dd>${model.recipe.status} canonical source / draft candidate</dd></div>
          <div><dt>Write boundary</dt><dd>Browser download only; canonical recipe mutation prohibited</dd></div>
        </dl>
      </details>

      <details class="filter-atelier__panel filter-atelier__disclosure" data-atelier-candidate-details>
        <summary>Inspect candidate JSON</summary>
        <pre
          class="filter-atelier__candidate"
          data-atelier-candidate
          data-testid="atelier-candidate-json"
        ></pre>
      </details>

      <div class="filter-atelier__actions">
        <button class="filter-atelier__primary" type="button" data-atelier-export>
          Export candidate
        </button>
        <button type="button" data-atelier-copy>Copy JSON</button>
        <button type="button" data-atelier-reset>Reset draft</button>
        <button type="button" data-atelier-close>Close atelier</button>
      </div>
    </div>
  `;

  const controlsHost = section.querySelector<HTMLElement>('[data-atelier-controls]');
  const dirtyHost = section.querySelector<HTMLElement>('[data-atelier-dirty]');
  const definitionsHost = section.querySelector<HTMLElement>('[data-atelier-definitions]');
  const previewHost = section.querySelector<HTMLElement>('[data-atelier-preview]');
  const previewSurface = section.querySelector<HTMLElement>('[data-atelier-preview-surface]');
  const previewNote = section.querySelector<HTMLElement>('[data-atelier-preview-note]');
  const validationHost = section.querySelector<HTMLElement>('[data-atelier-validation]');
  const candidateHost = section.querySelector<HTMLElement>('[data-atelier-candidate]');
  const resetButton = section.querySelector<HTMLButtonElement>('[data-atelier-reset]');
  const exportButton = section.querySelector<HTMLButtonElement>('[data-atelier-export]');
  const copyButton = section.querySelector<HTMLButtonElement>('[data-atelier-copy]');
  const closeButtons = section.querySelectorAll<HTMLButtonElement>('[data-atelier-close]');

  if (
    !controlsHost ||
    !dirtyHost ||
    !definitionsHost ||
    !previewHost ||
    !previewSurface ||
    !previewNote ||
    !validationHost ||
    !candidateHost ||
    !resetButton ||
    !exportButton ||
    !copyButton ||
    closeButtons.length === 0
  ) {
    throw new Error('Filter atelier surface failed to mount.');
  }

  const controls = new Map<
    string,
    { parameter: (typeof model.controls)[number]; elements: ControlElements }
  >();
  let latestValues = model.canonicalValues;
  let latestCandidate = '';
  let lastValidValues = model.canonicalValues;

  function commitControl(
    parameter: (typeof model.controls)[number],
    elements: ControlElements,
  ): void {
    try {
      store.set(
        parameter.key,
        readControlValue(elements.input, parameter),
      );
      elements.input.setCustomValidity('');
    } catch (error) {
      elements.input.setCustomValidity(
        error instanceof Error ? error.message : String(error),
      );
      elements.input.reportValidity();
    }
  }

  for (const parameter of model.controls) {
    const elements = createControl(parameter, parameter.canonicalValue);
    controls.set(parameter.key, { parameter, elements });
    controlsHost.append(elements.row);

    elements.input.addEventListener('input', () => {
      commitControl(parameter, elements);
    });

    elements.range?.addEventListener('input', () => {
      if (!elements.range) return;
      elements.input.value = elements.range.value;
      commitControl(parameter, elements);
    });
  }

  resetButton.addEventListener('click', () => store.reset());
  exportButton.addEventListener('click', () => {
    downloadCandidate(model, latestValues);
  });
  copyButton.addEventListener('click', async () => {
    if (!latestCandidate) return;
    await navigator.clipboard.writeText(latestCandidate);
    copyButton.textContent = 'Copied';
    window.setTimeout(() => {
      copyButton.textContent = 'Copy JSON';
    }, 1400);
  });

  store.subscribe((snapshot) => {
    latestValues = snapshot.values;
    section.dataset.dirty = String(snapshot.dirty);
    dirtyHost.textContent = snapshot.dirty
      ? `Draft · revision ${snapshot.revision}`
      : 'Canonical';

    const validation = validateDraft(model, snapshot.values);

    for (const [key, control] of controls) {
      const value = snapshot.values[key];
      if (value === undefined) {
        throw new Error(`Draft value missing for ${key}`);
      }

      writeControlValue(control.elements, value, control.parameter);
      const issue = validation.issues.find(
        (candidate) => candidate.path === `values.${key}`,
      );
      setControlIssue(control.elements, issue?.message ?? null);
      control.elements.input.setCustomValidity(issue?.message ?? '');
    }

    renderIssues(validationHost, validation.issues);
    exportButton.disabled = !validation.valid;
    copyButton.disabled = !validation.valid;

    if (validation.valid) {
      lastValidValues = snapshot.values;
      renderPreview(
        model.recipe,
        snapshot.values,
        definitionsHost,
        previewSurface,
      );
      previewHost.dataset.invalid = 'false';
      previewNote.textContent = 'Compiler output current';
      latestCandidate = serializeCandidate(model, snapshot.values);
      candidateHost.textContent = latestCandidate;
    } else {
      renderPreview(
        model.recipe,
        lastValidValues,
        definitionsHost,
        previewSurface,
      );
      previewHost.dataset.invalid = 'true';
      previewNote.textContent = 'Paused at last valid draft';
      latestCandidate = '';
      candidateHost.textContent =
        'Candidate serialization blocked until the draft is valid.';
    }
  });

  const surfaces: SiteSurfaceState[] = Array.from(
    document.querySelectorAll<HTMLElement>('.site-header, main, footer'),
  ).map((element) => ({
    element,
    inert: element.inert,
    ariaHidden: element.getAttribute('aria-hidden'),
  }));

  let atelierOpen = false;
  let savedScrollY = 0;
  let returnFocus: HTMLElement | null = null;

  function setOpen(nextOpen: boolean): void {
    if (nextOpen === atelierOpen) {
      section.hidden = !nextOpen;
      return;
    }

    atelierOpen = nextOpen;
    section.hidden = !nextOpen;

    if (nextOpen) {
      savedScrollY = window.scrollY;
      returnFocus = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      document.body.dataset.atelierOpen = 'true';

      for (const surface of surfaces) {
        surface.element.inert = true;
        surface.element.setAttribute('aria-hidden', 'true');
      }

      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        section.focus({ preventScroll: true });
      });
      return;
    }

    delete document.body.dataset.atelierOpen;
    for (const surface of surfaces) {
      surface.element.inert = surface.inert;
      if (surface.ariaHidden === null) {
        surface.element.removeAttribute('aria-hidden');
      } else {
        surface.element.setAttribute('aria-hidden', surface.ariaHidden);
      }
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: savedScrollY, behavior: 'instant' });
      returnFocus?.focus({ preventScroll: true });
    });
  }

  function syncVisibility(): void {
    setOpen(window.location.hash === '#atelier');
  }

  function closeAtelier(): void {
    history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}`,
    );
    setOpen(false);
  }

  for (const button of closeButtons) {
    button.addEventListener('click', closeAtelier);
  }

  document.body.append(section);
  syncVisibility();
  window.addEventListener('hashchange', syncVisibility);
  window.addEventListener('popstate', syncVisibility);
}
