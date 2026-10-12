import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const baseUrl = args.get("--url") ?? "http://127.0.0.1:5174/";
const outputDir = path.resolve(args.get("--output") ?? "artifacts/benthic-r3f-qa");
const results = [];
const errors = [];
const warnings = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createObservedPage(browser, name, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on("pageerror", error => errors.push(`${name}: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") errors.push(`${name}: ${message.text()}`);
    if (message.type() === "warning") warnings.push(`${name}: ${message.text()}`);
  });
  return { context, page };
}

async function verifyViewport(browser, name, viewport, contextOptions = {}) {
  console.error(`[qa] starting ${name}`);
  const { context, page } = await createObservedPage(browser, name, {
    viewport,
    deviceScaleFactor: 1,
    ...contextOptions,
  });

  const response = await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
  assert(response?.ok(), `${name}: expected a successful response`);

  const canvas = page.locator("canvas");
  await canvas.waitFor({ state: "visible" });
  await page.waitForTimeout(1_200);

  const title = await page.title();
  const heading = (await page.locator("h1").textContent())?.trim();
  const canvasState = await canvas.evaluate(element => {
    const gl = element.getContext("webgl2");
    const box = element.getBoundingClientRect();
    return {
      width: element.width,
      height: element.height,
      cssWidth: Math.round(box.width),
      cssHeight: Math.round(box.height),
      available: Boolean(gl),
      lost: gl?.isContextLost() ?? true,
    };
  });

  assert(title === "BENTHIC_R3F | Procedural Material System", `${name}: unexpected title`);
  assert(heading === "BENTHIC_R3F", `${name}: missing page heading`);
  assert(canvasState.available && !canvasState.lost, `${name}: WebGL2 context unavailable or lost`);
  assert(canvasState.width > 0 && canvasState.height > 0, `${name}: drawing buffer is empty`);
  assert(canvasState.cssWidth > 0 && canvasState.cssHeight > 0, `${name}: canvas has no visible layout size`);

  await page.getByRole("button", { name: "coral", exact: true }).click();
  await page.getByRole("button", { name: "eco", exact: true }).click();
  await page.locator("#control-tissue-density").fill("5.4");
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();

  const interaction = {
    coralPressed: await page.getByRole("button", { name: "coral", exact: true }).getAttribute("aria-pressed"),
    ecoPressed: await page.getByRole("button", { name: "eco", exact: true }).getAttribute("aria-pressed"),
    density: (await page.locator('output[for="control-tissue-density"]').textContent())?.trim(),
    paused: await page.getByRole("button", { name: "Resume motion", exact: true }).getAttribute("aria-pressed"),
  };

  assert(interaction.coralPressed === "true", `${name}: material palette did not update`);
  assert(interaction.ecoPressed === "true", `${name}: quality profile did not update`);
  assert(interaction.density === "5.40", `${name}: density control did not update`);
  assert(interaction.paused === "true", `${name}: pause control did not update`);

  const accessibility = await page.evaluate(() => ({
    sceneRole: document.querySelector(".canvas-shell")?.getAttribute("role"),
    sceneLabel: document.querySelector(".canvas-shell")?.getAttribute("aria-label"),
    artistControlsLabel: document.querySelector(".controls")?.getAttribute("aria-label"),
    unlabeledRanges: [...document.querySelectorAll('input[type="range"]')].filter(input => !input.labels?.length).length,
  }));
  assert(accessibility.sceneRole === "img" && Boolean(accessibility.sceneLabel), `${name}: scene is missing an accessible visual role and label`);
  assert(accessibility.artistControlsLabel === "Artist controls", `${name}: controls region is not labelled`);
  assert(accessibility.unlabeledRanges === 0, `${name}: a range control is missing a label`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assert(!overflow, `${name}: page has unintended horizontal overflow`);

  await page.screenshot({
    path: path.join(outputDir, `${name}.png`),
    fullPage: false,
    timeout: 60_000,
  });

  results.push({ name, viewport, title, heading, canvasState, interaction, accessibility, overflow });
  await context.close();
  console.error(`[qa] passed ${name}`);
}

async function verifyReducedMotion(browser) {
  const name = "reduced-motion";
  console.error(`[qa] starting ${name}`);
  const { context, page } = await createObservedPage(browser, name, {
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
  await page.locator("canvas").waitFor({ state: "visible" });

  const ecoPressed = await page.getByRole("button", { name: "eco", exact: true }).getAttribute("aria-pressed");
  const resumeVisible = await page.getByRole("button", { name: "Resume motion", exact: true }).isVisible();
  const motionTelemetry = (await page.locator(".telemetry div").filter({ hasText: "Motion" }).locator("dd").textContent())?.trim();

  assert(ecoPressed === "true", `${name}: Eco quality was not selected`);
  assert(resumeVisible, `${name}: animation was not initially paused`);
  assert(motionTelemetry === "paused", `${name}: motion telemetry did not report paused`);
  results.push({ name, ecoPressed, resumeVisible, motionTelemetry });
  await context.close();
  console.error(`[qa] passed ${name}`);
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});

try {
  await verifyViewport(browser, "desktop-1440x900", { width: 1440, height: 900 });
  await verifyViewport(browser, "mobile-390x844", { width: 390, height: 844 }, { hasTouch: true, isMobile: true });
  await verifyReducedMotion(browser);
  assert(errors.length === 0, `Browser errors: ${errors.join(" | ")}`);
} finally {
  await browser.close();
}

const receipt = {
  schema: "benthic-r3f.browser-qa.v1",
  generatedAt: new Date().toISOString(),
  url: baseUrl,
  status: errors.length === 0 ? "pass" : "fail",
  results,
  errors,
  warnings,
  boundaries: {
    physicalDevice: "unrun",
    thermalSoak: "unrun",
    stableFpsClaim: false,
    engineParity: "unrun",
  },
};

await writeFile(path.join(outputDir, "receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
console.log(JSON.stringify(receipt, null, 2));
