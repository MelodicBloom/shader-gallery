# BUILD_RECEIPT — MVT-ABALONE-001 SHELLSENS (run 5)

| Field | Value |
|---|---|
| Handoff (committed first) | receipts/BUILD_HANDOFF-MVT-ABALONE-001-SHELLSENS.md @ 7d8eb0d |
| Command | `cd material-validation-lab/reference/abalone && npm ci && npm run trial` (exit 0) |
| Renderer | SwiftShader (headless Chrome) — measured |
| Criterion | shell-masked fractionOver8 >= 0.01, all fixtures × each check × each variant — **unchanged** |
| automated.shellSens.automatedChannelCheck | **pass** (measured) |
| Trial label | **inconclusive** (awaiting named human review; authored-shell synthetic fail preserved) |

## shell-sens fractionOver8 (measured)
| Fixture | Check | Variant | fractionOver8 |
|---|---|---|---|
| neutral | iridescenceVisibleVsNeutralControl | synth-r | 0.3774 |
| neutral | iridescenceVisibleVsNeutralControl | synth-g | 0.1321 |
| neutral | iridescenceVisibleVsNeutralControl | synth-g-r1 | 0.8159 |
| neutral | rChannelContributes | synth-r | 0.0614 |
| neutral | gChannelContributes | synth-g | 0.1111 |
| neutral | gChannelContributes | synth-g-r1 | 0.4765 |
| neutral | channelsDistinct | synth-r | 0.4685 |
| neutral | channelsDistinct | synth-g | 0.3822 |
| neutral | channelsDistinct | synth-g-r1 | 0.4765 |
| grazing | iridescenceVisibleVsNeutralControl | synth-r | 0.5346 |
| grazing | iridescenceVisibleVsNeutralControl | synth-g | 0.1911 |
| grazing | iridescenceVisibleVsNeutralControl | synth-g-r1 | 0.6281 |
| grazing | rChannelContributes | synth-r | 0.0481 |
| grazing | gChannelContributes | synth-g | 0.087 |
| grazing | gChannelContributes | synth-g-r1 | 0.3827 |
| grazing | channelsDistinct | synth-r | 0.6392 |
| grazing | channelsDistinct | synth-g | 0.3931 |
| grazing | channelsDistinct | synth-g-r1 | 0.3827 |
| light-sweep | iridescenceVisibleVsNeutralControl | synth-r | 0.3717 |
| light-sweep | iridescenceVisibleVsNeutralControl | synth-g | 0.1321 |
| light-sweep | iridescenceVisibleVsNeutralControl | synth-g-r1 | 0.8117 |
| light-sweep | rChannelContributes | synth-r | 0.0614 |
| light-sweep | gChannelContributes | synth-g | 0.1109 |
| light-sweep | gChannelContributes | synth-g-r1 | 0.4765 |
| light-sweep | channelsDistinct | synth-r | 0.4623 |
| light-sweep | channelsDistinct | synth-g | 0.3833 |
| light-sweep | channelsDistinct | synth-g-r1 | 0.4765 |

## Same run, other fixtures (measured)
- Authored shell synthetic: iridescenceVisible/r/g = fail, channelsDistinct = pass (run-3 fail reproduced; historical run 3 untouched).
- Run-4 plane sensitivity: pass (all checks, all variants).
- Asset map (post-hoc): rChannelContributes false at neutral/grazing.

## Interpretation (proposed)
H2 supported: same geometry/UVs pass once metalness/roughness/maps are overridden. H1 remains inconclusive. Factor
attribution unresolved (bundled only, per handoff). C-07, C-09 open.

## Validators (measured exit codes)
validate:material-lab 0; test:material-lab 0; validate:meta 0; verify-source-archive 0; validate:shaders 1 (blocked: missing -lEGL/-lGLESv2, pre-existing).

## Not done (out of scope)
One-factor splits, human review, merge of PR #31, Bubble/Gold/Console, record status/thickness default changes.
