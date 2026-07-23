import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const repositoryRoot = path.resolve(packageRoot, "../../..");
const previewRoot = path.join(repositoryRoot, "library-v1");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".glsl": "text/plain; charset=utf-8",
  ".png": "image/png"
};

function createStaticServer(root) {
  return http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const requested = decodeURIComponent(url.pathname === "/" ? "/library-v1/" : url.pathname);
    const candidate = path.resolve(repositoryRoot, `.${requested}`);
    if (!candidate.startsWith(repositoryRoot + path.sep)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    let file = candidate;
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.setHeader("Content-Type", mimeTypes[path.extname(file)] || "application/octet-stream");
    response.setHeader("Cache-Control", "no-store");
    fs.createReadStream(file).pipe(response);
  });
}

if (!fs.existsSync(path.join(previewRoot, "index.html"))) {
  throw new Error("Run node tools/build-live-preview.mjs before browser QA.");
}

const server = createStaticServer(previewRoot);
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}/library-v1/?qa=1`;
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"]
});

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 }
];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("requestfailed", request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.waitForSelector('html[data-qa-state="ready"]');
    await page.waitForSelector('[data-shader-card][data-live="ready"]', { timeout: 20_000 });

    const results = await page.evaluate(() => ({
      cards: document.querySelectorAll("[data-shader-card]").length,
      webgl2: Boolean(document.createElement("canvas").getContext("webgl2")),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      firstCanvas: (() => {
        const canvas = document.querySelector(".shader-canvas");
        return canvas ? { width: canvas.width, height: canvas.height } : null;
      })()
    }));

    if (results.cards !== 15) throw new Error(`${viewport.name}: expected 15 cards, found ${results.cards}`);
    if (!results.webgl2) throw new Error(`${viewport.name}: WebGL2 is unavailable in browser QA`);
    if (results.overflow > 1) throw new Error(`${viewport.name}: horizontal overflow ${results.overflow}px`);
    if (!results.firstCanvas || results.firstCanvas.width < 2 || results.firstCanvas.height < 2) {
      throw new Error(`${viewport.name}: first live canvas has invalid dimensions`);
    }

    await page.locator(".open-shader").first().click();
    await page.waitForSelector("#shader-dialog[open]");
    await page.waitForSelector('#detail-stage[data-live="ready"]', { timeout: 20_000 });
    const controls = page.locator('#uniform-controls input[type="range"]');
    if (await controls.count()) {
      const first = controls.first();
      const max = Number(await first.getAttribute("max"));
      await first.fill(String(max));
    }
    await page.locator("#detail-play").click();
    if ((await page.locator("#detail-play").textContent())?.trim() !== "Play") {
      throw new Error(`${viewport.name}: pause control did not update`);
    }
    await page.locator(".dialog-close-row button").click();

    if (errors.length) throw new Error(`${viewport.name}: browser errors:\n${errors.join("\n")}`);
    await context.close();
    console.log(`✓ ${viewport.name} ${viewport.width}×${viewport.height}`);
  }

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(baseUrl, { waitUntil: "networkidle" });
  await reducedPage.waitForSelector('html[data-qa-state="ready"][data-reduced-motion="true"]');
  await reducedContext.close();
  console.log("✓ reduced-motion behavior");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
