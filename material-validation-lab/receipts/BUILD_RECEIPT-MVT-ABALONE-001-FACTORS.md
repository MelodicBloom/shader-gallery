# BUILD_RECEIPT — MVT-ABALONE-001 FACTORS (run 6: 6a shell-rough0, 6b shell-metal1)

| Field | Value |
|---|---|
| Handoff (committed first) | receipts/BUILD_HANDOFF-MVT-ABALONE-001-FACTORS.md @ 03edc32 |
| Command | `cd material-validation-lab/reference/abalone && npm ci && npm run trial` (exit 0) |
| Renderer | SwiftShader (headless Chrome) — measured |
| Criterion | shell-masked fractionOver8 >= 0.01, all fixtures × each check × each synth variant, per one-factor variant — **unchanged** (8/255 cut-off unchanged) |
| automated.shellRough0.automatedChannelCheck | **fail** (measured) |
| automated.shellMetal1.automatedChannelCheck | **pass** (measured) |
| automated.shellSens (run 5, re-measured) | pass (measured; values identical to run 5) |
| Trial label | **inconclusive** (awaiting named human review; authored-shell synthetic fail preserved) |

Fixture state verified in captures' materialState (measured): rough0 = roughness 0, roughnessMap off, metalness 0.5,
metalnessMap/normalMap on, FrontSide; metal1 = metalness 1, metalnessMap off, roughness 1, roughnessMap/normalMap on, FrontSide.
✗ = below 0.01.

## shellRough0 fractionOver8 (measured) — automatedChannelCheck **fail**
| Check | Variant | neutral | grazing | light-sweep |
|---|---|---|---|---|
| iridescenceVisibleVsNeutralControl | synth-r | 0.005 ✗ | 0.0074 ✗ | 0.0072 ✗ |
| iridescenceVisibleVsNeutralControl | synth-g | 0.0018 ✗ | 0.0033 ✗ | 0.0018 ✗ |
| iridescenceVisibleVsNeutralControl | synth-g-r1 | 0.0146 | 0.0172 | 0.0197 |
| rChannelContributes | synth-r | 0.0018 ✗ | 0.0024 ✗ | 0.0019 ✗ |
| gChannelContributes | synth-g | 0.0012 ✗ | 0.0007 ✗ | 0.0011 ✗ |
| gChannelContributes | synth-g-r1 | 0.0091 ✗ | 0.0103 | 0.011 |
| channelsDistinct | synth-r | 0.0225 | 0.0277 | 0.0334 |
| channelsDistinct | synth-g | 0.006 ✗ | 0.0067 ✗ | 0.0074 ✗ |
| channelsDistinct | synth-g-r1 | 0.0091 ✗ | 0.0103 | 0.011 |

## shellMetal1 fractionOver8 (measured) — automatedChannelCheck **pass**
| Check | Variant | neutral | grazing | light-sweep |
|---|---|---|---|---|
| iridescenceVisibleVsNeutralControl | synth-r | 0.5351 | 0.5808 | 0.4877 |
| iridescenceVisibleVsNeutralControl | synth-g | 0.2516 | 0.2417 | 0.2466 |
| iridescenceVisibleVsNeutralControl | synth-g-r1 | 0.8625 | 0.6806 | 0.8386 |
| rChannelContributes | synth-r | 0.0835 | 0.0733 | 0.0848 |
| gChannelContributes | synth-g | 0.1512 | 0.1001 | 0.1516 |
| gChannelContributes | synth-g-r1 | 0.5297 | 0.4527 | 0.5353 |
| channelsDistinct | synth-r | 0.5918 | 0.6923 | 0.5661 |
| channelsDistinct | synth-g | 0.5101 | 0.4445 | 0.5077 |
| channelsDistinct | synth-g-r1 | 0.5297 | 0.4527 | 0.5353 |

## Interpretation (per locked rule; proposed)
metal1 clears, rough0 fails → **metalness path dominates** under this metric. Roughness 0 alone (metalness 0.5 × map)
leaves every check below criterion — even iridescenceVisibleVsNeutralControl for synth-r/synth-g — so roughness is not
sufficient. metal1 clears with roughnessMap and normalMap still authored and FrontSide, so neither roughness, normalMap
nor DoubleSide is required for the shell to clear. The run-5 bundle was over-specified on those axes. (unverified)
Whether the metalnessMap itself or the 0.5 scalar is the compressor is not separated: 6b changes both, as pre-registered.

## Not done (scope)
No third variant, no criterion change, no human review, no merge, no Bubble/Gold/Console, no ACES/HDRI. History runs 1–5
and UV diagnostics preserved in receipt.json. C-07 thickness default untouched.

## Validators (measured exit codes)
validate:material-lab 0; test:material-lab 0; validate:meta 0; `node tools/verify-source-archive.mjs` 0; validate:shaders 1 (blocked: missing -lEGL/-lGLESv2, pre-existing).
