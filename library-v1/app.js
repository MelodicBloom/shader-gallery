import { ShaderPlayer } from "./runtime/ShaderPlayer.js";

const qaMode = new URLSearchParams(location.search).has("qa");
const reducedMotionQuery = matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointerQuery = matchMedia("(pointer: coarse)");
const grid = document.querySelector("#shader-grid");
const template = document.querySelector("#shader-card-template");
const libraryStatus = document.querySelector("#library-status");
const liveCount = document.querySelector("#live-count");
const motionStatus = document.querySelector("#motion-status");
const pauseAllButton = document.querySelector("#pause-all");
const filterGroup = document.querySelector("#category-filters");
const dialog = document.querySelector("#shader-dialog");
const detailStage = document.querySelector("#detail-stage");
const detailCanvas = document.querySelector("#detail-canvas");
const detailFallback = document.querySelector("#detail-fallback");
const detailState = document.querySelector("#detail-state");
const detailPlay = document.querySelector("#detail-play");
const detailReset = document.querySelector("#detail-reset");
const detailFullscreen = document.querySelector("#detail-fullscreen");
const detailCapture = document.querySelector("#detail-capture");
const uniformControls = document.querySelector("#uniform-controls");
const uniformCount = document.querySelector("#uniform-count");

let manifest;
let filter = "All";
let globalPaused = false;
let detailController = null;
let dragPointerId = null;
const cardControllers = [];
const activeCards = new Set();

const pixelRatio = Math.min(window.devicePixelRatio || 1, coarsePointerQuery.matches ? 1.25 : 1.5);
const maxLiveCards = coarsePointerQuery.matches || (navigator.deviceMemory && navigator.deviceMemory <= 4) ? 1 : 3;

function assetPath(path) {
  return `./${path.replace(/^\.\//, "")}`;
}

function setMotionCopy() {
  const reduced = reducedMotionQuery.matches;
  document.documentElement.dataset.reducedMotion = String(reduced);
  motionStatus.textContent = reduced ? "Reduced motion: fixed frames" : "Motion: live while visible";
}
setMotionCopy();

function updateLiveCount() {
  liveCount.textContent = String([...activeCards].filter(controller => controller.player?.running).length);
}

function visibleCardControllers() {
  return cardControllers.filter(controller => controller.visible && !controller.card.hidden);
}

function rebalanceLiveCards(preferred = null) {
  if (document.hidden || globalPaused || reducedMotionQuery.matches) {
    for (const controller of cardControllers) controller.pause();
    updateLiveCount();
    return;
  }

  const eligible = visibleCardControllers();
  const ordered = preferred && eligible.includes(preferred)
    ? [preferred, ...eligible.filter(item => item !== preferred)]
    : eligible;

  const allowed = new Set(ordered.slice(0, maxLiveCards));
  for (const controller of cardControllers) {
    if (allowed.has(controller)) controller.play().catch(() => {});
    else controller.pause();
  }
  updateLiveCount();
}

function applyUniformDefaults(player, meta) {
  for (const [name, definition] of Object.entries(meta.uniforms ?? {})) {
    if (["u_time", "u_resolution", "u_mouse", "u_res"].includes(name)) continue;
    player.setUniform(name, definition.type, definition.default);
  }
}

class CardController {
  constructor(entry, card) {
    this.entry = entry;
    this.card = card;
    this.canvas = card.querySelector(".shader-canvas");
    this.badge = card.querySelector(".status-badge");
    this.player = null;
    this.meta = null;
    this.visible = false;
    this.initializing = null;
  }

  async init() {
    if (this.player) return this;
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      this.card.dataset.live = "loading";
      this.badge.textContent = "Loading";
      this.meta = await fetch(assetPath(this.entry.meta)).then(response => {
        if (!response.ok) throw new Error(`Metadata request failed: ${response.status}`);
        return response.json();
      });

      const player = new ShaderPlayer(this.canvas, assetPath(this.entry.shader), {
        autoStart: false,
        autoResize: true,
        trackPointer: true,
        preserveDrawingBuffer: false,
        pixelRatio
      });
      await player.init();
      applyUniformDefaults(player, this.meta);
      player.setFixedTime(this.meta.preview?.time ?? 1.2345);
      player.renderOnce({ time: this.meta.preview?.time ?? 1.2345 });
      player.setFixedTime(null);
      this.player = player;
      this.card.dataset.live = "ready";
      this.badge.textContent = reducedMotionQuery.matches ? "Live · frozen" : "Live";
      activeCards.add(this);
      document.documentElement.dataset.qaLive = "ready";
      return this;
    })().catch(error => {
      console.error(`[Shader Library] ${this.entry.slug}`, error);
      this.card.dataset.live = "error";
      this.badge.textContent = "Static fallback";
      this.card.title = error.message;
      throw error;
    }).finally(() => {
      this.initializing = null;
    });

    return this.initializing;
  }

  async play() {
    await this.init();
    if (!this.visible || document.hidden || globalPaused || reducedMotionQuery.matches) {
      this.pause();
      return;
    }
    this.player.start();
    this.badge.textContent = "Live";
    updateLiveCount();
  }

  pause() {
    this.player?.stop();
    if (this.player && this.card.dataset.live === "ready") {
      this.badge.textContent = reducedMotionQuery.matches ? "Live · frozen" : "Live · paused";
    }
    updateLiveCount();
  }
}

const observer = new IntersectionObserver(entries => {
  for (const observed of entries) {
    const controller = observed.target.__shaderController;
    controller.visible = observed.isIntersecting && observed.intersectionRatio > 0.12;
    if (!controller.visible) controller.pause();
  }
  rebalanceLiveCards();
}, { rootMargin: "160px 0px", threshold: [0, 0.12, 0.45] });

function createCard(entry) {
  const card = template.content.firstElementChild.cloneNode(true);
  card.dataset.slug = entry.slug;
  card.dataset.category = entry.category;
  card.querySelector(".shader-fallback").src = assetPath(entry.preview);
  card.querySelector(".shader-fallback").alt = `${entry.name} static shader preview`;
  card.querySelector(".category-badge").textContent = entry.category;
  card.querySelector(".shader-name").textContent = entry.name;
  card.querySelector(".shader-family").textContent = entry.family;
  card.querySelector(".open-shader__label").textContent = entry.name;

  const controller = new CardController(entry, card);
  card.__shaderController = controller;
  cardControllers.push(controller);
  observer.observe(card);

  card.addEventListener("pointerenter", () => {
    controller.visible = true;
    rebalanceLiveCards(controller);
  });
  card.addEventListener("pointerdown", () => {
    controller.visible = true;
    rebalanceLiveCards(controller);
  }, { passive: true });
  card.querySelector(".open-shader").addEventListener("click", () => openDetail(entry));
  return card;
}

function renderFilters(entries) {
  const categories = ["All", ...new Set(entries.map(entry => entry.category))];
  for (const category of categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.textContent = category;
    button.dataset.category = category;
    button.setAttribute("aria-pressed", String(category === filter));
    button.addEventListener("click", () => {
      filter = category;
      for (const control of filterGroup.children) {
        control.setAttribute("aria-pressed", String(control.dataset.category === filter));
      }
      for (const controller of cardControllers) {
        controller.card.hidden = filter !== "All" && controller.entry.category !== filter;
        if (controller.card.hidden) controller.pause();
      }
      rebalanceLiveCards();
      libraryStatus.textContent = filter === "All" ? "Showing all shader families." : `Showing ${filter} shaders.`;
    });
    filterGroup.append(button);
  }
}

function adjustableUniforms(meta) {
  return Object.entries(meta.uniforms ?? {}).filter(([, definition]) =>
    definition.ui === "slider" && ["float", "int"].includes(definition.type) && Number.isFinite(definition.min) && Number.isFinite(definition.max)
  );
}

function createUniformControls(meta, player) {
  uniformControls.replaceChildren();
  const adjustable = adjustableUniforms(meta);
  uniformCount.textContent = adjustable.length ? `${adjustable.length} adjustable` : "Defaults only";

  if (!adjustable.length) {
    const message = document.createElement("p");
    message.className = "empty-controls";
    message.textContent = "This shader currently exposes no public sliders. Pointer position and animation time remain available to the shader.";
    uniformControls.append(message);
    return [];
  }

  for (const [name, definition] of adjustable) {
    const wrapper = document.createElement("div");
    wrapper.className = "uniform-control";
    wrapper.dataset.uniform = name;

    const row = document.createElement("div");
    row.className = "uniform-label-row";
    const label = document.createElement("label");
    const inputId = `uniform-${name}`;
    label.htmlFor = inputId;
    label.textContent = definition.semanticRole || name;
    const output = document.createElement("output");
    output.className = "uniform-output";
    output.htmlFor = inputId;

    const input = document.createElement("input");
    input.type = "range";
    input.id = inputId;
    input.name = name;
    input.min = definition.min;
    input.max = definition.max;
    input.step = definition.step ?? (definition.type === "int" ? 1 : 0.01);
    input.value = definition.default;
    output.value = String(definition.default);
    output.textContent = String(definition.default);

    input.addEventListener("input", () => {
      const value = definition.type === "int" ? Number.parseInt(input.value, 10) : Number(input.value);
      output.value = input.value;
      output.textContent = input.value;
      player.setUniform(name, definition.type, value);
      if (!player.running) player.renderOnce({ time: meta.preview?.time ?? 1.2345 });
    });

    row.append(label, output);
    wrapper.append(row, input);
    uniformControls.append(wrapper);
  }
  return adjustable;
}

async function openDetail(entry) {
  if (detailController) closeDetail();

  document.querySelector("#detail-title").textContent = entry.name;
  document.querySelector("#detail-family").textContent = `${entry.category} · ${entry.family}`;
  detailFallback.src = assetPath(entry.preview);
  detailFallback.alt = `${entry.name} static fallback`;
  detailStage.dataset.live = "loading";
  detailState.textContent = "Preparing live preview…";
  uniformControls.replaceChildren();
  dialog.showModal();

  const controller = {
    entry,
    player: null,
    meta: null,
    adjustable: [],
    paused: false
  };
  detailController = controller;

  try {
    const meta = await fetch(assetPath(entry.meta)).then(response => {
      if (!response.ok) throw new Error(`Metadata request failed: ${response.status}`);
      return response.json();
    });
    if (detailController !== controller) return;
    controller.meta = meta;
    document.querySelector("#detail-description").textContent = meta.description;
    const tagList = document.querySelector("#detail-tags");
    tagList.replaceChildren(...(meta.tags ?? []).map(tag => {
      const chip = document.createElement("span");
      chip.textContent = tag;
      return chip;
    }));

    const player = new ShaderPlayer(detailCanvas, assetPath(entry.shader), {
      autoStart: false,
      autoResize: true,
      trackPointer: true,
      preserveDrawingBuffer: true,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.75)
    });
    await player.init();
    if (detailController !== controller) {
      player.destroy();
      return;
    }
    controller.player = player;
    applyUniformDefaults(player, meta);
    player.renderOnce({ time: meta.preview?.time ?? 1.2345 });
    controller.adjustable = createUniformControls(meta, player);
    detailStage.dataset.live = "ready";
    detailState.textContent = "Live WebGL2 preview ready.";

    if (reducedMotionQuery.matches || globalPaused) {
      controller.paused = true;
      detailPlay.textContent = "Play";
    } else {
      player.start();
      detailPlay.textContent = "Pause";
    }
    detailCanvas.focus({ preventScroll: true });
  } catch (error) {
    console.error("[Shader Library detail]", error);
    detailStage.dataset.live = "error";
    detailState.textContent = `Live preview unavailable: ${error.message}`;
    detailPlay.textContent = "Unavailable";
    detailPlay.disabled = true;
  }
}

function closeDetail() {
  detailController?.player?.destroy();
  detailController = null;
  detailStage.dataset.live = "idle";
  detailCanvas.width = 1;
  detailCanvas.height = 1;
  uniformControls.replaceChildren();
  detailPlay.disabled = false;
  detailPlay.textContent = "Pause";
  dragPointerId = null;
}

dialog.addEventListener("close", closeDetail);
dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

detailPlay.addEventListener("click", () => {
  const controller = detailController;
  if (!controller?.player) return;
  controller.paused = !controller.paused;
  if (controller.paused) {
    controller.player.stop();
    detailPlay.textContent = "Play";
  } else {
    controller.player.setFixedTime(null).start();
    detailPlay.textContent = "Pause";
  }
});

detailReset.addEventListener("click", () => {
  const controller = detailController;
  if (!controller?.player || !controller.meta) return;
  applyUniformDefaults(controller.player, controller.meta);
  for (const [name, definition] of controller.adjustable) {
    const input = uniformControls.querySelector(`[name="${CSS.escape(name)}"]`);
    if (!input) continue;
    input.value = definition.default;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
  controller.player.setFixedTime(controller.meta.preview?.time ?? 1.2345);
  controller.player.renderOnce({ time: controller.meta.preview?.time ?? 1.2345 });
  controller.player.setFixedTime(null);
  if (!controller.paused && !reducedMotionQuery.matches) controller.player.start();
});

detailFullscreen.addEventListener("click", async () => {
  if (!document.fullscreenElement) await detailStage.requestFullscreen?.();
  else await document.exitFullscreen?.();
});

detailCapture.addEventListener("click", async () => {
  const controller = detailController;
  if (!controller?.player) return;
  const blob = await controller.player.captureFrame();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${controller.entry.slug.replaceAll("/", "-")}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function mapDragToControls(event) {
  const controller = detailController;
  if (!controller?.player || !controller.adjustable.length || dragPointerId !== event.pointerId) return;
  const rect = detailStage.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  const coordinates = [x, 1 - y];
  controller.adjustable.slice(0, 2).forEach(([name, definition], index) => {
    const input = uniformControls.querySelector(`[name="${CSS.escape(name)}"]`);
    if (!input) return;
    const value = definition.min + coordinates[index] * (definition.max - definition.min);
    const stepped = Math.round(value / (definition.step || 0.01)) * (definition.step || 0.01);
    input.value = String(stepped);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

detailStage.addEventListener("pointerdown", event => {
  dragPointerId = event.pointerId;
  detailStage.setPointerCapture?.(event.pointerId);
  mapDragToControls(event);
});
detailStage.addEventListener("pointermove", mapDragToControls);
detailStage.addEventListener("pointerup", event => {
  if (dragPointerId === event.pointerId) dragPointerId = null;
});
detailStage.addEventListener("pointercancel", () => { dragPointerId = null; });
detailStage.addEventListener("dblclick", () => detailPlay.click());
detailCanvas.addEventListener("keydown", event => {
  if (event.code === "Space") {
    event.preventDefault();
    detailPlay.click();
  }
});

pauseAllButton.addEventListener("click", () => {
  globalPaused = !globalPaused;
  pauseAllButton.setAttribute("aria-pressed", String(globalPaused));
  pauseAllButton.textContent = globalPaused ? "Resume visible" : "Pause all";
  if (globalPaused) {
    for (const controller of cardControllers) controller.pause();
    detailController?.player?.stop();
  } else {
    rebalanceLiveCards();
    if (detailController?.player && !detailController.paused && !reducedMotionQuery.matches) detailController.player.start();
  }
});

document.addEventListener("visibilitychange", () => rebalanceLiveCards());
reducedMotionQuery.addEventListener("change", () => {
  setMotionCopy();
  for (const controller of cardControllers) {
    if (controller.player && reducedMotionQuery.matches) {
      controller.pause();
      controller.player.setFixedTime(controller.meta?.preview?.time ?? 1.2345);
      controller.player.renderOnce({ time: controller.meta?.preview?.time ?? 1.2345 });
    } else {
      controller.player?.setFixedTime(null);
    }
  }
  rebalanceLiveCards();
});

async function boot() {
  try {
    manifest = await fetch("./manifest.json").then(response => {
      if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`);
      return response.json();
    });
    if (!Array.isArray(manifest.shaders) || manifest.shaders.length !== 15) {
      throw new Error(`Expected 15 shader records; received ${manifest.shaders?.length ?? "none"}.`);
    }

    document.querySelector("#shader-count").textContent = String(manifest.shaders.length);
    renderFilters(manifest.shaders);
    grid.replaceChildren(...manifest.shaders.map(createCard));
    libraryStatus.textContent = "Static previews are ready. Visible cards are upgrading to live WebGL2.";
    document.documentElement.dataset.qaState = "ready";

    if (qaMode) {
      const first = cardControllers[0];
      first.visible = true;
      await first.init();
      first.player.renderOnce({ time: first.meta.preview?.time ?? 1.2345 });
      window.__shaderLibraryQA = {
        entries: manifest.shaders.length,
        activeCount: () => [...activeCards].length,
        openDetail: slug => {
          const entry = manifest.shaders.find(item => item.slug === slug);
          if (entry) return openDetail(entry);
        }
      };
    } else {
      rebalanceLiveCards();
    }
  } catch (error) {
    console.error("[Shader Library boot]", error);
    libraryStatus.textContent = `The library could not initialize: ${error.message}`;
    document.documentElement.dataset.qaState = "error";
  }
}

boot();
