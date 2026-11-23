/**
 * SVG Filter Lab — Animation Controllers
 * All filter animation runs via setAttribute — never CSS transitions.
 * Tabs that are hidden pause all animation loops via visibilitychange.
 */

'use strict';

// ── Utilities ────────────────────────────────────────────────

function rand(min, max, decimals = 3) {
  return (min + Math.random() * (max - min)).toFixed(decimals);
}

function safeQuery(selector) {
  const el = document.querySelector(selector);
  if (!el) console.warn(`[svg-filter-lab] Element not found: ${selector}`);
  return el;
}

// ── Glitch Controller ────────────────────────────────────────

export function initGlitchFilter(filterId = 'glitch-distort') {
  const turbulence = safeQuery(`#${filterId} feTurbulence`);
  if (!turbulence) return;

  let active = !document.hidden;

  const tick = () => {
    if (!active) return;
    turbulence.setAttribute('baseFrequency', `${rand(0.12, 0.30)} ${rand(0.12, 0.30)}`);
    setTimeout(tick, 120);
  };

  tick();

  document.addEventListener('visibilitychange', () => {
    active = !document.hidden;
    if (active) tick();
  });
}

// ── CRT Glitch Controller (targets glitchNoise result only) ──

export function initCrtGlitchController(filterId = 'crt-glitch-rgb') {
  const glitchNoise = safeQuery(`#${filterId} feTurbulence[result="glitchNoise"]`);
  if (!glitchNoise) return;

  let active = !document.hidden;

  const tick = () => {
    if (!active) return;
    glitchNoise.setAttribute('baseFrequency', `${rand(0.10, 0.28)} ${rand(0.10, 0.28)}`);
    setTimeout(tick, 120);
  };

  tick();

  document.addEventListener('visibilitychange', () => {
    active = !document.hidden;
    if (active) tick();
  });
}

// ── Interactive Glass Specular Light ─────────────────────────

export function initGlassSpecular(cardSelector = '.glass-card', lightId = 'glass-light') {
  const card = safeQuery(cardSelector);
  const light = safeQuery(`#${lightId}`);
  if (!card || !light) return;

  card.classList.add('is-animating');

  card.addEventListener('mousemove', (e) => {
    const box = card.getBoundingClientRect();
    const nx = (e.clientX - box.left) / box.width - 0.5;
    const ny = (e.clientY - box.top) / box.height - 0.5;

    const rx = -(ny * 6).toFixed(2);
    const ry = (nx * 6).toFixed(2);
    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;

    light.setAttribute('x', Math.round((e.clientX - box.left) * 1.5));
    light.setAttribute('y', Math.round((e.clientY - box.top) * -1.5));
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    light.setAttribute('x', '150');
    light.setAttribute('y', '-150');
    card.classList.remove('is-animating');
  });

  card.addEventListener('mouseenter', () => {
    card.classList.add('is-animating');
  });
}

// ── Auto-Init (called from individual demo pages) ────────────

export function autoInit() {
  if (document.querySelector('#glitch-distort')) initGlitchFilter();
  if (document.querySelector('#crt-glitch-rgb')) initCrtGlitchController();
  if (document.querySelector('#glass-light')) initGlassSpecular();
}

document.addEventListener('DOMContentLoaded', autoInit);
