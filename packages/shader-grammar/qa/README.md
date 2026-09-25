# Repository QA

From this directory run `npm ci --ignore-scripts`, then `npm test`. Node.js 22 or newer is required for this QA harness; the preserved baseline declares Node 18 or newer. The lockfile pins QA dependencies. The baseline itself has no third-party runtime dependencies.

The suite verifies all 28 imported file hashes, runs the original validator, validates schemas and instances with AJV Draft 2020-12, parses the taxonomy with YAML, and tests additional graph and parameter guardrails. Every negative fixture must both change its input and produce its expected diagnostic.

`npm run benchmark` compares original and enhanced validator process runtimes using nine alternating pairs after one warmup each. It includes process startup, disk reads and schema compilation. The enhanced gate performs additional checks, so the comparison measures their total overhead. Results are machine-specific observations, not a universal performance threshold or GPU measurement.

Results are written to `../.qa-tmp/`, ignored by Git and uploaded by CI. Tests do not rewrite committed receipts or preserved package files.

Known limitations: this is not a complete shader type checker. It does not establish operator port type compatibility, a physical unit system, renderer equivalence or visual fidelity. The original generic signatures, mathematical placeholders, duplicate example and unused parameters remain in the immutable baseline for future versioned refinement.
