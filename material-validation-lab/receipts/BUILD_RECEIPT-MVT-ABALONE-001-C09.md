# BUILD_RECEIPT — MVT-ABALONE-001 C-09 sensitivity probe (run 4)

2026-10-26 (America/New_York). Labels: measured / proposed / historical / unverified / blocked.

- Repo: MelodicBloom/shader-gallery, `/workspace/shader-gallery`; branch `feat/mvt-abalone-001`; draft PR #31 (not merged).
- Start SHA: `2bf981c456b6b9cf4057a9942cbb7ba73da0561d`. Handoff commit (before any probe code): `8e88ee48116df98ee5c45073daf35494df3ae8a0`. Probe commit: `df97c8e5a6e735a7032e4267cc29e76397e22e93`. Final SHA: this receipt's commit (see `git log`).
- Handoff: `material-validation-lab/receipts/BUILD_HANDOFF-MVT-ABALONE-001-C09.md`. Receipt JSON: `material-validation-lab/reference/abalone/receipts/receipt.json`.

## Criterion (historical: locked in handoff before run 4; not revised)
Masked `fractionOver8 >= 0.01` at ALL of neutral/grazing/light-sweep for EACH check, EACH synth variant. 8/255 cut-off unchanged.

## Results (measured, SwiftShader)
Sensitivity fixture: flat plane, metalness 1, roughness 0 (metalness/roughness/normal maps removed so overrides apply), iridescence 1, 600–800 nm, RoomEnvironment + ACES. fractionOver8 neutral / grazing / light-sweep:

| Check | Variant | neutral | grazing | light-sweep | Locked criterion |
|---|---|---|---|---|---|
| iridescenceVisibleVsNeutralControl | synth-r | 0.0520 | 0.6096 | 0.0519 | met |
| | synth-g (R=0.5) | 0.1650 | 0.8754 | 0.1650 | met |
| | synth-g-r1 (R=1) | 0.7391 | 0.9396 | 0.7389 | met |
| rChannelContributes | synth-r | 0.1018 | 0.5944 | 0.1018 | met |
| gChannelContributes | synth-g (R=0.5) | 0.0250 | 0.7763 | 0.0250 | met |
| | synth-g-r1 (R=1) | 0.4823 | 0.8950 | 0.4821 | met |
| channelsDistinct | synth-r | 0.4382 | 0.9425 | 0.4380 | met |
| | synth-g | 0.3942 | 0.9391 | 0.3941 | met |
| | synth-g-r1 | 0.4823 | 0.8950 | 0.4821 | met |

- `automated.sensitivity.automatedChannelCheck = pass`; perVariant synth-r/synth-g/synth-g-r1 = pass (measured).
- Shell fixture synthetic re-measured in the same run: identical to run 3 (rChannel 0.0055/0.0049/0.0073; gChannel 0.0047/0.0028/0.0044) → still `fail` (measured). Asset map: rChannelContributes still below criterion at neutral/grazing (measured).
- Trial `label = inconclusive` (pre-registered rule: sensitivity clears → inconclusive, awaiting named human review). Run-3 `fail` preserved in `history` (historical). No `pass` emitted. Console errors: 0.
- Diagnostics only (measured, do not affect label): synth-g-r1 treatment vs G-only mean 0 (R=1 equals the no-map default, as expected); plane light-sweep ≈ neutral (mirror plane, key light azimuth barely reaches camera) so light-sweep adds little independent evidence on the plane (unverified interpretation).

## Interpretation
- (proposed) C-09 fixture-compression hypothesis partially supported: the channel paths are detectable by the locked metric on a generous fixture. Not evidence of correctness on the shell or on hardware.
- C-09 stays OPEN; C-07 open (record default [100,400] untouched); C-08 asset-R tension unchanged.
- Record `abalone-baseline.record.json` status left `fail` (validators do not require a change); source zip not refreshed (record unchanged). Tension: record `fail` vs receipt `inconclusive` — for the owner to decide.

## Commands (measured exit codes)
`npm ci` 0; `npm run fetch-asset` 0; `npm run trial` 0; validate-material-lab 0; test-validate-material-lab 0; validate-meta 0; verify-source-archive 0; validate-shaders 1 (blocked: missing -lEGL/-lGLESv2, pre-existing); serve smoke: /, /app.js, new map, receipt.json all HTTP 200.

## Blocked
Frame times (SwiftShader); hardware GPU fidelity; ACES uncontrolled; human review pending.

## Next slice (proposed, not started)
Named human GPU review of run-3 shell and run-4 plane captures on hardware. MVT-BUBBLE-001 / Gold / Console not started.

## Stop condition reached
Definition of done; no softening urge required (criterion met unchanged).
