# BUILD_HANDOFF — MVT-ABALONE-001 SHELLSENS (run 5)

Status: **proposed / pre-registered**. Committed before any run-5 measurement code or trial run.

## Question
Does the shell material (metalness, roughness, metalness/roughness/normal maps) compress the iridescence channel response
on the shell geometry? This tests H2 (material compression) against H1 (UV coverage; inconclusive from UVDIAG).

## Criterion (unchanged, locked)
shell-masked `fractionOver8 >= 0.01` (fraction of masked pixels whose mean RGB abs-diff is > 8/255), at ALL of
neutral / grazing / light-sweep, for EACH check: rChannelContributes (treatment vs G-only), gChannelContributes
(treatment vs R-only), iridescenceVisibleVsNeutralControl (treatment vs control), channelsDistinct (R-only vs G-only),
for EACH map variant below. Threshold and 8/255 cut-off are not to be lowered or revised after results.

## Fixture `shell-sens` (pre-declared)
- Geometry: the abalone shell mesh used by the authored trial (not the plane).
- Material: same override bundle as the run-4 plane fixture (`sens()` in app.js): metalness 1.0, roughness 0.0,
  metalnessMap / roughnessMap / normalMap = null, side DoubleSide. No other changes.
- Environment: RoomEnvironment + ACESFilmic unchanged. No HDRI, no ACES toggle.
- Thickness: asset-authored 600–800 nm. Record default untouched (C-07 stays open).
- Maps: synth-r, synth-g (R=0.5), synth-g-r1 (R=1.0). Control: iridescence 0, no iridescence maps.
- Mask: shell pixels in the shell-sens control frame (same mask rule as prior runs).

## Factor discipline
One bundled shell-sens measurement only. No roughness-only / metalness-only variants in this slice.
FAIL → stop; further variants need a new handoff. PASS → note one-factor splits as next slice; do not run them.

## Labels
- `automated.shellSens.automatedChannelCheck` = pass | fail.
- Trial label: shell-sens pass → `inconclusive` (awaiting named human review; authored shell fail preserved).
  shell-sens fail → `fail` (authored shell and shell-sens both fail). Never `pass` without named human review.
- Run-3 shell fail and run-4 plane pass stay in history. UV diagnostics remain diagnostics only.

## Interpretation (pre-declared)
- Pass → supports H2 (shell material compresses response); H1 stays inconclusive.
- Fail → weakens H2 as sole cause; geometry/UV (H1) or shell-specific factors remain candidates.

## Out of scope
Softening criterion, UV re-bake, new metric, HDRI, ACES, human review, merging PR #31, Bubble/Gold/Console.
