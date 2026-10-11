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

const baseUrl = args.get("--url") ?? "http://127.0.0.1:4173/benthic-os/";
const outputDir = path.resolve(args.get("--output") ?? "artifacts/benthic-os-qa");
const results = [];
const errors = [];
const warnings = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function verifyViewport(browser, name, viewport) {
  console.error(`[qa] starting ${name}`);
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.on("pageerror", error => errors.push(`${name}: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") errors.push(`${name}: ${message.text()}`);
    if (message.type() === "warning") warnings.push(`${name}: ${message.text()}`);
  });

  const response = await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 15_000 });
  assert(response?.ok(), `${name}: expected a successful response`);
  await page.waitForTimeout(500);

  const title = await page.title();
  const heading = (await page.locator("h1").textContent())?.trim();
  const canvasVisible = await page.locator("#gl").isVisible();
  const fallbackVisible = await page.locator("#fallback").isVisible();
  const contextState = await page.evaluate(() => {
    const canvas = document.querySelector("#gl");
    const gl = canvas?.getContext("webgl2");
    return {
      width: canvas?.width ?? 0,
      height: canvas?.height ?? 0,
      available: Boolean(gl),
      lost: gl?.isContextLost() ?? true,
    };
  });

  assert(title === "BENTHIC_OS | Deep Sea Morphogenesis", `${name}: unexpected page title`);
  assert(heading === "BENTHIC_OS", `${name}: missing page heading`);
  assert(canvasVisible, `${name}: WebGL canvas is not visible`);
  assert(!fallbackVisible, `${name}: fallback is visible despite WebGL2 availability`);
  assert(contextState.available && !contextState.lost, `${name}: WebGL2 context unavailable or lost`);
  assert(contextState.width > 0 && contextState.height > 0, `${name}: drawing buffer is empty`);

  await page.locator('[data-quality="eco"]').click({ force: true });
  await page.locator('[data-palette="coral"]').click({ force: true });
  await page.locator("#density").evaluate(element => {
    element.value = "5.4";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#codeButton").click({ force: true });

  const interaction = {
    quality: (await page.locator("#qualityReadout").textContent())?.trim(),
    coralPressed: await page.locator('[data-palette="coral"]').getAttribute("aria-pressed"),
    density: (await page.locator("#densityOut").textContent())?.trim(),
    codeOpen: await page.locator("#codeSheet").getAttribute("data-open"),
    codeVisible: await page.locator("#codePreview").isVisible(),
  };

  assert(interaction.quality === "eco", `${name}: quality control did not update`);
  assert(interaction.coralPressed === "true", `${name}: palette control did not update`);
  assert(interaction.density === "5.40", `${name}: density control did not update`);
  assert(interaction.codeOpen === "true" && interaction.codeVisible, `${name}: GLSL sheet did not open`);

  await page.locator("#closeCode").click({ force: true });
  assert((await page.locator("#codeSheet").getAttribute("data-open")) === "false", `${name}: GLSL sheet did not close`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert(!overflow, `${name}: page has unintended horizontal overflow`);
  await page.screenshot({
    path: path.join(outputDir, `${name}.png`),
    fullPage: false,
    timeout: 60_000,
  });

  results.push({ name, viewport, title, heading, canvasVisible, fallbackVisible, contextState, interaction, overflow });
  await context.close();
  console.error(`[qa] passed ${name}`);
}

async function verifyReducedMotion(browser) {
  console.error("[qa] starting reduced-motion");
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.on("pageerror", error => errors.push(`reduced-motion: ${error.message}`));
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 15_000 });
  const quality = (await page.locator("#qualityReadout").textContent())?.trim();
  const speed = (await page.locator("#speedOut").textContent())?.trim();
  assert(quality === "eco", "reduced-motion: Eco quality was not selected");
  assert(speed === "0.00", "reduced-motion: shader time was not stopped");
  results.push({ name: "reduced-motion", quality, speed });
  await context.close();
  console.error("[qa] passed reduced-motion");
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});

try {
  await verifyViewport(browser, "desktop-1440x900", { width: 1440, height: 900 });
  await verifyViewport(browser, "mobile-390x844", { width: 390, height: 844 });
  await verifyReducedMotion(browser);
  assert(errors.length === 0, `Browser errors: ${errors.join(" | ")}`);
} finally {
  await browser.close();
}

const receipt = {
  schema: "benthic-os.browser-qa.v1",
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
  },
};

await writeFile(path.join(outputDir, "receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
console.log(JSON.stringify(receipt, null, 2));
