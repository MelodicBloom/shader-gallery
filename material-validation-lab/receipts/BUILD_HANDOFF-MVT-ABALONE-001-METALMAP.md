# BUILD_HANDOFF — MVT-ABALONE-001 METALMAP (run 7: separate metalness scalar from metalnessMap)

Status: **proposed / pre-registered**. Committed before any run-7 code or measurement.
Trigger: owner answer to widget t14s7 — "New handoff: metalness 1 with authored map kept".

## Question
Run 6 (measured): `shell-metal1` (metalness 1.0 **and** metalnessMap null) cleared; `shell-rough0` failed.
Does clearing require nulling `metalnessMap`, or is scalar metalness = 1 with the authored map kept enough?

## Criterion (unchanged, locked)
shell-masked `fractionOver8 >= 0.01` (fraction of masked pixels with mean RGB abs-diff > 8/255) at ALL of
neutral / grazing / light-sweep, for EACH of iridescenceVisibleVsNeutralControl, rChannelContributes,
gChannelContributes, channelsDistinct, for EACH of synth-r, synth-g (R=0.5), synth-g-r1 (R=1.0), evaluated per
variant, same check→variant mapping as runs 5–6. Threshold 0.01 and cut-off 8/255 are NOT lowered or revised.

## Known mechanism (proposed — from three.js API/shader-chunk docs and FACTORS handoff note; NOT measured GPU math)
three.js computes `metalnessFactor = metalness * texture(metalnessMap).b`. So metalness = 1 with the map kept is
**not** a constant-1 metalness field: it equals the authored map's B channel per texel (authored scalar 0.5 → 1.0
doubles it). The map's B distribution was not measured in this handoff (unverified).

## Variants (pre-declared, exact)
1. **`shell-metal1-mapkept`** (primary, new): shell mesh; `metalness = 1.0`; `metalnessMap` KEPT as authored;
   roughness 1.0 + roughnessMap, normalMap, aoMap, base map authored; side FrontSide (authored, matches shell-metal1).
2. **`shell-metal05-mapnull`** (optional third, included — same runner loop, cheap): shell mesh; metalness authored
   0.5; `metalnessMap = null`; everything else authored, FrontSide. Completes the 2×2 (value × map present).
- Anchors re-measured in the same run, definitions unchanged: `shell-metal1` (1.0, map null; expect pass as run 6),
  authored `shell` synthetic (0.5, map kept; expect fail).
- 2×2: authored (0.5,map) | mapkept (1.0,map) | mapnull (0.5,null) | metal1 (1.0,null).
- Shared: iridescence 1.0; thickness 600–800 nm (C-07 default untouched); RoomEnvironment + ACESFilmic unchanged;
  control = same variant with iridescence 0 and no iridescence maps; mask = shell pixels in variant control frame.

## Interpretation (locked)
- mapkept PASS & metal1 PASS → scalar metalness=1 sufficient; nulling the map was unnecessary (proposed).
- mapkept FAIL & metal1 PASS → nulling metalnessMap (or map×scalar interaction) required; metalness=1 alone not
  enough under authored map (proposed).
- metal1 FAIL (either case) → regression/environment issue; stop and report.
- mapnull: PASS → removing the map alone (at 0.5) is enough; FAIL → map removal alone insufficient. Read 2×2
  honestly: if only metal1 passes, both changes are jointly needed (interaction); no further factors this slice.

## Labels
`automated.shellMetal1MapKept.automatedChannelCheck` and `automated.shellMetal05MapNull.automatedChannelCheck` =
pass|fail. Trial stays `inconclusive` (no human review); labelReason updated. History runs 1–6 + UV diagnostics kept.

## Out of scope
Roughness variants, ACES/HDRI, softening criterion, merge PR #31, Bubble/Gold/Console, record status H, human review.
