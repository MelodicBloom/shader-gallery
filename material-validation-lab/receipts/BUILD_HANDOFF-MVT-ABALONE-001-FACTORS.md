# BUILD_HANDOFF — MVT-ABALONE-001 FACTORS (run 6: 6a shell-rough0, 6b shell-metal1)

Status: **proposed / pre-registered**. Committed before any run-6 measurement code or trial run.
Trigger: owner answer to widget t14s3 — "Run one-factor splits: roughness-only and metalness-only".

## Question
Run 5 (bundled `shell-sens`: metalness 1, roughness 0, metalness/roughness/normal maps null, DoubleSide) cleared the
criterion on the shell mesh (measured). Which single factor of that bundle is sufficient on its own?

## Criterion (unchanged, locked)
shell-masked `fractionOver8 >= 0.01` (fraction of masked pixels whose mean RGB abs-diff is > 8/255) at ALL of
neutral / grazing / light-sweep, for EACH of iridescenceVisibleVsNeutralControl, rChannelContributes,
gChannelContributes, channelsDistinct, for EACH map variant synth-r, synth-g (R=0.5), synth-g-r1 (R=1.0) — evaluated
**per variant** (rough0 and metal1 independently). Same check→variant mapping as run 5. Threshold and 8/255 cut-off are
not lowered or revised after results.

## Authored material facts (measured from the pinned GLB JSON before coding)
- `metallicFactor` 0.5; `roughnessFactor` absent → 1.0; one `metallicRoughnessTexture` (index 3) → three.js sets the
  same texture as both `roughnessMap` (G) and `metalnessMap` (B); `normalTexture` index 2; `doubleSided` absent → FrontSide.
- three.js multiplies scalar × map: `roughness = roughness * texel.g`, `metalness = metalness * texel.b`.

## Variant definitions (pre-declared, exact)
1. **`shell-rough0`** (run 6a): shell mesh; `roughness = 0.0`; `roughnessMap = null`; metalness authored 0.5;
   `metalnessMap`, `normalMap`, `side` (FrontSide), aoMap, base colour map all authored.
   Choice note: 0 × map = 0, so the roughness override would stick even with the map; the map is nulled anyway, as
   specified, for symmetry. No other map is needed to make the override effective.
2. **`shell-metal1`** (run 6b): shell mesh; `metalness = 1.0`; `metalnessMap = null`; roughness authored 1.0;
   `roughnessMap`, `normalMap`, `side` (FrontSide), aoMap, base colour map all authored.
   IF/THEN (pre-registered): metalness 1 × texel.b would make the override ineffective, so nulling `metalnessMap` is
   required and is part of the fixture — not a post-hoc change. No further map is nulled.
- Note: unlike shell-sens, neither variant sets DoubleSide (side stays authored). This is declared now; the side
  difference is a known confound between run 5 and run 6 and is not tested in this slice.
- Shared: iridescence asset-authored (1.0); thickness 600–800 nm (C-07 record default untouched); RoomEnvironment +
  ACESFilmic unchanged; control = same variant material with iridescence 0 and no iridescence maps; mask = shell pixels
  in that variant's control frame (same rule as prior runs).
- Authored `shell`, `plane` (run 4) and bundled `shell-sens` (run 5) are re-measured unchanged for comparison.
- Exactly two variants. No third variant, no normalMap-only, no maps-stripped-only, no ACES/HDRI.

## Interpretation (locked)
- rough0 clears, metal1 fails → roughness (and/or its map) is the dominant compressor under this metric (proposed).
- metal1 clears, rough0 fails → metalness path dominates (proposed).
- both clear → either factor alone is sufficient; the run-5 bundle was over-specified (proposed).
- neither clears → normalMap and/or multi-factor interaction (or side) still required; H2 refined, not closed. Next
  slice only via a new handoff (e.g. maps-stripped-only or normalMap-null-only); not run here.

## Labels
- `automated.shellRough0.automatedChannelCheck` and `automated.shellMetal1.automatedChannelCheck` = pass | fail.
- Trial never `pass` without named human review. Trial stays `inconclusive` while any sensitivity path (plane,
  shell-sens, or a one-factor variant) clears and authored still fails; labelReason names which factors cleared.
  One-factor fails do not overwrite the run-5 shell-sens pass. History runs 1–5 and UV diagnostics preserved.

## Out of scope
Third+ variants, softening criterion, UV re-bake, record status H, human review, merging PR #31, Bubble/Gold/Console,
ACES/HDRI experiments.
