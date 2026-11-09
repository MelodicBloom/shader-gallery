/**
 * Page + GL lifecycle for the runtime: bfcache (pagehide/pageshow) and WebGL context loss/restore.
 * DOM-free so it can be unit-tested; main.ts wires real events to these handlers.
 */
export type LifecycleHooks = {
  /** Cancel the rAF loop. Must be idempotent. */
  stopLoop(): void;
  /** Request the rAF loop again with the existing player/context. */
  startLoop(): void;
  /** Destroy the player and drop GL resources. */
  release(): void;
  /** Build a fresh player/context (async ok). */
  reinitialize(): void;
  /** True when the current GL context reports isContextLost() or no player exists. */
  contextUnusable(): boolean;
  /** Optional UI hook for status text. */
  onState?(state: LifecycleState): void;
};
export type LifecycleState = 'running' | 'suspended' | 'context-lost' | 'released';

export function createPageLifecycle(hooks: LifecycleHooks) {
  let suspended = false;   // page hidden by pagehide (possibly in bfcache)
  let contextLost = false; // webglcontextlost seen, not yet restored
  let released = false;    // player destroyed (non-persisted pagehide)
  let restoredWhileSuspended = false;
  const emit = (s: LifecycleState) => hooks.onState?.(s);

  return {
    get state(): LifecycleState { return released ? 'released' : contextLost ? 'context-lost' : suspended ? 'suspended' : 'running'; },
    /** pagehide: always stop rAF. persisted=true may enter bfcache, so keep the context but flag it; otherwise release. */
    pagehide(persisted: boolean) {
      suspended = true; hooks.stopLoop();
      if (!persisted) { hooks.release(); released = true; emit('released'); } else emit('suspended');
    },
    /** pageshow: on a bfcache restore, resume the loop, or rebuild if the context was lost or released meanwhile. */
    pageshow(persisted: boolean) {
      if (!suspended && !persisted) return; // first load: initialize() is called by main.ts
      suspended = false;
      if (released || restoredWhileSuspended || hooks.contextUnusable()) {
        if (contextLost && !restoredWhileSuspended && !released) { emit('context-lost'); return; } // wait for webglcontextrestored
        released = false; contextLost = false; restoredWhileSuspended = false;
        hooks.reinitialize(); emit('running'); return;
      }
      hooks.startLoop(); emit('running');
    },
    contextlost() { contextLost = true; hooks.stopLoop(); emit('context-lost'); },
    contextrestored() {
      if (suspended) { restoredWhileSuspended = true; contextLost = false; return; } // rebuild on pageshow
      contextLost = false; hooks.reinitialize(); emit('running');
    },
  };
}
