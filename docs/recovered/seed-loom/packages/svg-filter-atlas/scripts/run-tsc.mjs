import { access, constants } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const rootTsc = fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url));
const localTsc = fileURLToPath(new URL("../node_modules/.bin/tsc", import.meta.url));

async function resolveTsc() {
  for (const candidate of [rootTsc, localTsc]) {
    const candidates = process.platform === "win32"
      ? [`${candidate}.CMD`, `${candidate}.cmd`, candidate]
      : [candidate];
    for (const executable of candidates) {
      try {
        await access(executable, constants.X_OK);
        return executable;
      } catch {
        // try the next candidate
      }
    }
  }
  throw new Error("Unable to locate a tsc binary in the root or package node_modules.");
}

const tsc = await resolveTsc();
const result = spawnSync(tsc, process.argv.slice(2), {
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
