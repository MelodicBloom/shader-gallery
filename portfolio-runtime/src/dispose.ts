/**
 * Dispose a ShaderPlayer without touching GL objects that belong to a lost (or lost-then-restored) context.
 * Deleting those objects logs `INVALID_OPERATION: delete: object does not belong to this context`.
 */
export type DisposablePlayer = {
  gl: { isContextLost(): boolean } | null;
  program?: unknown;
  quad?: unknown;
  destroy(): void;
};

/**
 * createdEpoch/currentEpoch count context losses: a player built before the latest loss owns stale objects
 * even after webglcontextrestored (isContextLost() is false again by then).
 * Returns 'deleted' when GL objects were deleted, 'dropped' when only references were released.
 */
export function disposePlayer(player: DisposablePlayer | null | undefined, createdEpoch: number, currentEpoch: number): 'none' | 'deleted' | 'dropped' {
  if (!player) return 'none';
  const stale = createdEpoch !== currentEpoch || !player.gl || player.gl.isContextLost();
  if (stale) { player.gl = null; player.program = null; player.quad = null; }
  player.destroy(); // with gl === null, destroy() only stops rAF, disconnects observers and aborts listeners
  return stale ? 'dropped' : 'deleted';
}
