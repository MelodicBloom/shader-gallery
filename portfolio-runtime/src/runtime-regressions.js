/**
 * Keep the previous frame time across non-motion state updates, including
 * repeated pointer events. Explicit phase and motion-mode changes rebase it.
 * @param {number} elapsed
 * @param {number} previous
 * @param {{time:number, playback:string, reducedMotion:boolean}} before
 * @param {{time:number, playback:string, reducedMotion:boolean}} after
 * @param {number} now
 */
export function synchronizeClock(elapsed, previous, before, after, now) {
  const phaseChanged = before.time !== after.time;
  const modeChanged = before.playback !== after.playback || before.reducedMotion !== after.reducedMotion;
  return {
    elapsed: phaseChanged ? after.time : elapsed,
    previous: phaseChanged || modeChanged ? now : previous,
  };
}

/**
 * Resize using explicit integer buffer dimensions and pixelRatio 1. ShaderPlayer
 * otherwise clamps ratios below 0.25, defeating the budget at large sizes.
 * @param {{options:{pixelRatio:number}, resize:(width:number, height:number)=>unknown}} player
 * @param {number} width
 * @param {number} height
 * @param {number} deviceRatio
 * @param {number} maxPixels
 */
export function resizeWithinBudget(player, width, height, deviceRatio, maxPixels) {
  if (![width, height, deviceRatio, maxPixels].every(Number.isFinite) ||
      width <= 0 || height <= 0 || deviceRatio <= 0 || maxPixels < 1) return 1;
  const limit = Math.floor(maxPixels);
  const ratio = Math.min(deviceRatio, 1.5, Math.sqrt(limit / (width * height)));
  const bufferWidth = Math.min(limit, Math.max(1, Math.floor(width * ratio)));
  const bufferHeight = Math.min(Math.floor(limit / bufferWidth), Math.max(1, Math.floor(height * ratio)));
  player.options.pixelRatio = 1;
  player.resize(bufferWidth, bufferHeight);
  return ratio;
}
