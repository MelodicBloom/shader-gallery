import type { ParameterValue } from '@melodicbloom/svg-filter-atlas';
import type { AuthoringModel } from './model';

export interface DraftSnapshot {
  values: Readonly<Record<string, ParameterValue>>;
  dirty: boolean;
  revision: number;
}

type Listener = (snapshot: DraftSnapshot) => void;

function valuesEqual(
  left: Readonly<Record<string, ParameterValue>>,
  right: Readonly<Record<string, ParameterValue>>,
): boolean {
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => Object.is(left[key], right[key]))
  );
}

export class DraftStore {
  readonly #canonical: Readonly<Record<string, ParameterValue>>;
  #values: Record<string, ParameterValue>;
  #revision = 0;
  readonly #listeners = new Set<Listener>();

  constructor(model: AuthoringModel) {
    this.#canonical = Object.freeze({ ...model.canonicalValues });
    this.#values = { ...model.canonicalValues };
  }

  snapshot(): DraftSnapshot {
    return Object.freeze({
      values: Object.freeze({ ...this.#values }),
      dirty: !valuesEqual(this.#values, this.#canonical),
      revision: this.#revision,
    });
  }

  set(key: string, value: ParameterValue): void {
    if (!(key in this.#canonical)) {
      throw new Error(`Unknown authoring parameter: ${key}`);
    }

    this.#values = { ...this.#values, [key]: value };
    this.#revision += 1;
    this.#emit();
  }

  reset(): void {
    this.#values = { ...this.#canonical };
    this.#revision += 1;
    this.#emit();
  }

  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    listener(this.snapshot());
    return () => this.#listeners.delete(listener);
  }

  #emit(): void {
    const snapshot = this.snapshot();
    for (const listener of this.#listeners) listener(snapshot);
  }
}
