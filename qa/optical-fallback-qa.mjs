import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "packages/shader-library-v1/source/package.json"));
const { chromium } = require("playwright");
const html = fs.readFileSync(path.join(root, "docs/optical-studies-02.html"));
const server = http.createServer((request, response) => {
  if (request.url !== "/docs/optical-studies-02.html") return response.writeHead(404).end();
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(html);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type === "webgl2" ? null : original.call(this, type, ...args);
    };
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/docs/optical-studies-02.html`);
  await page.waitForFunction(() => {
    const image = document.querySelector("#fallback");
    return image && !image.hidden && image.complete && image.naturalWidth > 0;
  });
  assert.equal(await page.locator("#interactionHint").isVisible(), false);
  assert.equal(await page.locator("#controlHelp").isVisible(), false);
  assert.equal(await page.locator("#controls").evaluate(node => node.disabled), true);
  const before = await page.locator("#fallback").getAttribute("src");
  await page.getByRole("button", { name: /Labradorite Schiller/ }).click();
  await page.waitForFunction(previous => {
    const image = document.querySelector("#fallback");
    return image && image.getAttribute("src") !== previous && image.complete && image.naturalWidth > 0;
  }, before);
  assert.match(await page.locator("#title").textContent(), /Labradorite Schiller/);
  assert.match(await page.locator("#notice").textContent(), /selected study/);
  assert.deepEqual(errors, []);
  console.log("✓ optical static fallback guidance and study selection");
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
