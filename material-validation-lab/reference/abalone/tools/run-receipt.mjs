// Per-run receipt for MVT-ABALONE-001: who/what/when rendered this run, and how far the result may be claimed.
// Pure helpers (no browser) so they can be unit-tested with node:test.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render driver|mesa offscreen/i;

export function gitCommit(cwd) {
  try {
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const dirty = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() !== "";
    return { sha: /^[0-9a-f]{40}$/.test(sha) ? sha : "unavailable", dirtyWorkingTree: dirty };
  } catch { return { sha: "unavailable", dirtyWorkingTree: null }; }
}

const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : "unavailable");

/**
 * verdict: the automated trial label may only lower the claim, never raise it.
 *  - "blocked" / "fail" are measured outcomes and are reported as-is.
 *  - everything else (including any "pass") is capped at "inconclusive": no named human review and,
 *    on a software rasterizer, no GPU or visual evidence.
 */
export function buildRunReceipt({ label, commit, environment, browserVersion, now = new Date(), reviewDecision = "pending" }) {
  const renderer = str(environment?.renderer);
  const software = renderer === "unavailable" ? null : SOFTWARE_RENDERER.test(renderer);
  const measuredNegative = label === "fail" || label === "blocked";
  const verdict = measuredNegative ? label : "inconclusive";
  return {
    schemaVersion: "0.1.0",
    timestamp: now.toISOString(),
    commit: { sha: commit?.sha || "unavailable", dirtyWorkingTree: commit?.dirtyWorkingTree ?? null },
    userAgent: str(environment?.userAgent),
    browser: browserVersion ? `Chrome ${browserVersion} (headless, playwright-core)` : "unavailable",
    renderer,
    vendor: str(environment?.vendor),
    glVersion: str(environment?.glVersion),
    rendererClass: software === null ? "unavailable" : software ? "software" : "hardware-reported",
    trialLabel: label ?? "unavailable",
    verdict,
    verdictBasis: measuredNegative
      ? `automated trial label "${label}" (measured)`
      : `capped at inconclusive: human review ${reviewDecision}${software ? "; software rasterizer" : ""}`,
    evidenceScope: software === false
      ? "hardware renderer reported by WebGL; captures still need named human visual review"
      : "compile and render only (software EGL / SwiftShader or unknown renderer): not GPU evidence, not visual evidence",
    nonClaims: ["GPU verification", "visual pass", "frame rate / performance", "physical calibration"],
  };
}

export function runReceiptFileName(run) {
  const stamp = run.timestamp.replace(/[:.]/g, "-");
  const sha = run.commit.sha === "unavailable" ? "nosha" : run.commit.sha.slice(0, 7);
  return `run-${stamp}-${sha}.json`;
}

/** Write one immutable attempt receipt without replacing the last complete trial receipt. */
export function writeRunAttempt(root, run) {
  const runsDir = path.join(root, "receipts", "runs");
  fs.mkdirSync(runsDir, { recursive: true });
  const file = path.join(runsDir, runReceiptFileName(run));
  fs.writeFileSync(file, JSON.stringify(run, null, 2) + "\n", { flag: "wx" });
  return file;
}

/** Carry label-inert diagnostics into a regenerated complete receipt. */
export function carryForwardDiagnostics(nextReceipt, previousReceipt) {
  if (nextReceipt?.diagnostics !== undefined || previousReceipt?.diagnostics === undefined) return nextReceipt;
  return { ...nextReceipt, diagnostics: previousReceipt.diagnostics };
}
