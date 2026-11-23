import './isolation.css';
import type {
  FilterParameter,
  ParameterValue,
} from '@melodicbloom/svg-filter-atlas';

export interface ControlElements {
  row: HTMLElement;
  input: HTMLInputElement;
  range: HTMLInputElement | null;
  output: HTMLOutputElement;
  issue: HTMLElement;
}

function formatValue(
  value: ParameterValue,
  parameter: FilterParameter,
): string {
  if (parameter.unit === 'deg') return `${value}°`;
  if (parameter.unit) return `${value} ${parameter.unit}`;
  return String(value);
}

export function createControl(
  parameter: FilterParameter,
  value: ParameterValue,
): ControlElements {
  const row = document.createElement('div');
  row.className = 'filter-atelier__control';
  row.dataset.controlKey = parameter.key;

  const head = document.createElement('div');
  head.className = 'filter-atelier__control-head';

  const title = document.createElement('label');
  title.className = 'filter-atelier__control-title';
  title.htmlFor = `atelier-value-${parameter.key}`;
  title.textContent = parameter.label;

  const output = document.createElement('output');
  output.htmlFor = `atelier-value-${parameter.key}`;
  output.value = String(value);
  output.textContent = formatValue(value, parameter);

  head.append(title, output);

  const field = document.createElement('div');
  field.className = 'filter-atelier__control-field';

  const input = document.createElement('input');
  input.id = `atelier-value-${parameter.key}`;
  input.dataset.parameterKey = parameter.key;
  input.name = parameter.key;

  let range: HTMLInputElement | null = null;

  if (parameter.type === 'number' || parameter.type === 'integer') {
    input.type = 'number';
    input.inputMode = parameter.type === 'integer' ? 'numeric' : 'decimal';
    input.value = String(value);
    if (parameter.min !== undefined) input.min = String(parameter.min);
    if (parameter.max !== undefined) input.max = String(parameter.max);
    input.step = String(
      parameter.type === 'integer' ? 1 : (parameter.step ?? 'any'),
    );

    if (parameter.min !== undefined && parameter.max !== undefined) {
      range = document.createElement('input');
      range.type = 'range';
      range.className = 'filter-atelier__range';
      range.tabIndex = -1;
      range.min = String(parameter.min);
      range.max = String(parameter.max);
      range.step = String(
        parameter.type === 'integer' ? 1 : (parameter.step ?? 'any'),
      );
      range.value = String(value);
      range.setAttribute('aria-hidden', 'true');
    }
  } else if (parameter.type === 'color') {
    input.type = 'color';
    input.value = String(value);
  } else if (parameter.type === 'boolean') {
    input.type = 'checkbox';
    input.checked = Boolean(value);
  } else {
    input.type = 'text';
    input.value = String(value);
  }

  field.append(input);
  if (range) field.append(range);

  const meta = document.createElement('p');
  meta.id = `atelier-meta-${parameter.key}`;
  meta.className = 'filter-atelier__control-meta';
  meta.textContent = [
    parameter.min === undefined ? null : `${parameter.min}`,
    parameter.max === undefined ? null : `${parameter.max}`,
    parameter.step === undefined
      ? null
      : `${parameter.step}${parameter.unit === 'deg' ? '°' : parameter.unit ?? ''} increments`,
  ]
    .filter(Boolean)
    .join(' — ');

  const issue = document.createElement('p');
  issue.id = `atelier-issue-${parameter.key}`;
  issue.className = 'filter-atelier__control-issue';
  issue.hidden = true;

  input.setAttribute(
    'aria-describedby',
    `${meta.id} ${issue.id}`,
  );

  row.append(head, field, meta, issue);
  return { row, input, range, output, issue };
}

export function readControlValue(
  input: HTMLInputElement,
  parameter: FilterParameter,
): ParameterValue {
  if (parameter.type === 'number' || parameter.type === 'integer') {
    if (!Number.isFinite(input.valueAsNumber)) {
      throw new TypeError(`${parameter.label} must be a number`);
    }
    return input.valueAsNumber;
  }

  if (parameter.type === 'boolean') return input.checked;
  return input.value;
}

export function writeControlValue(
  elements: ControlElements,
  value: ParameterValue,
  parameter: FilterParameter,
): void {
  if (elements.input.type === 'checkbox') {
    elements.input.checked = Boolean(value);
  } else {
    elements.input.value = String(value);
  }

  if (elements.range) elements.range.value = String(value);
  elements.output.value = String(value);
  elements.output.textContent = formatValue(value, parameter);
}

export function setControlIssue(
  elements: ControlElements,
  message: string | null,
): void {
  elements.row.dataset.invalid = String(Boolean(message));
  elements.input.setAttribute('aria-invalid', String(Boolean(message)));
  elements.issue.hidden = !message;
  elements.issue.textContent = message ?? '';
}
