# BUILD_RECEIPT — MVT-ABALONE-001 synthetic isolated R/G maps (run 3)

Date 2026-10-26 (America/New_York). Labels: measured / proposed / historical / unverified / blocked.

## SHAs
- Start: `ec4de436684b669f0631bb7ba34b4e4504fac761`
- Criterion locked (handoff commit, before run 3): `08a4bec4af803c1eed91c6a4b93c4232e61733ea`
- Synthetic maps: `266f4c11492c437e702d1813a6f8071fa632479d`; run-3 wiring + receipt: `584f5a9208ae839ce6d2536d9ced45174c10c20b`
- Branch `feat/mvt-abalone-001`; draft PR #31 (not merged).

## Result
**Label: `fail`** (measured, automated) for the R/G channel-independence hypothesis under the pre-registered criterion (shell-masked `fractionOver8 >= 0.01`, all fixtures × each check). Criterion not revised after results. `review.decision: pending`. Frame time `blocked` (SwiftShader).

| Check (synthetic, measured fractionOver8) | neutral | grazing | light-sweep | Locked criterion |
|---|---|---|---|---|
| rChannelContributes (synth-r, treatment vs G-only) | 0.0055 | 0.0049 | 0.0073 | fail |
| gChannelContributes (synth-g, treatment vs R-only) | 0.0047 | 0.0028 | 0.0044 | fail |
| iridescenceVisible vs control — synth-r | 0.0113 | 0.0147 | 0.0196 | met |
| iridescenceVisible vs control — synth-g | 0.0049 | 0.0060 | 0.0048 | fail (→ check fails) |
| channelsDistinct — synth-r | 0.0517 | 0.0595 | 0.0799 | met |
| channelsDistinct — synth-g | 0.0173 | 0.0155 | 0.0190 | met (→ check passes) |

Asset map (same run, post-hoc metric, measured): rChannelContributes 0.0075 / 0.0077 / 0.0103 — identical to run 2; other asset checks met. `automated.asset.automatedChannelCheck = fail`.
Maps: both synthetic maps and asset maps reported `NoColorSpace` (measured). Console errors: none (measured). Asset captures byte-identical to run 2 (git shows no change).

## Commands + exit codes (measured)
| Command | Exit |
|---|---|
| `reference/abalone: npm ci` | 0 |
| `npm run fetch-asset` | 0 |
| `npm run trial` | 1 (label `fail`, by design) |
| `PORT=4199 npm run serve` → `/` and synthetic PNG HTTP 200 | ok (default 4173 was already occupied by an existing process: EADDRINUSE) |
| `node tools/validate-material-lab.mjs` | 0 |
| `node tools/test-validate-material-lab.mjs` | 0 |
| `node tools/validate-meta.mjs` | 0 |
| `node tools/verify-source-archive.mjs` (zip member for record refreshed) | 0 |
| `node tools/validate-shaders.mjs` | 1 — blocked/pre-existing: `ld: cannot find -lEGL / -lGLESv2` |

## Files
- New: `receipts/BUILD_HANDOFF-MVT-ABALONE-001-SYNTH.md`, this receipt, `reference/abalone/tools/make-synthetic-maps.mjs`, `reference/abalone/assets/synthetic/{r-gradient-const-g,g-gradient-const-r}.png`, six `receipts/captures/synth-*-treatment.png`.
- Changed: `reference/abalone/{app.js,index.html,tools/run-trial.mjs,README.md,receipts/receipt.json,receipts/captures/page.png}`, `CONFLICT_LEDGER.md` (C-08 update, new C-09, C-07 restated), lab `README.md`, `abalone-baseline.record.json` status → `fail` (thickness default untouched, C-07), source zip member refreshed.

## Open tensions
C-07 (thickness default) unresolved. C-08 answered with `fail` under pre-registration, not closed by pass. C-09 (proposed, unverified): fail may reflect fixture/renderer sensitivity (metalness 0.5, roughness 1, ACES, SwiftShader, R=0.5 in synth-g, 8/255 cut-off) rather than absent channel behaviour.

## Next slice (not started)
Named human GPU review of run-3 captures on hardware (`review.decision` stays pending until then). Any re-test must be a newly pre-registered run; do not lower this threshold.
