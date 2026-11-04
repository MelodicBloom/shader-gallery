# Material Research Pattern Cards

These cards are reusable choices, not source code. Their evidence is indexed in [`SOURCE_CATALOG.json`](SOURCE_CATALOG.json); each material still needs its own record and receipt.

## 1. Reference asset before procedural imitation

- **Trigger:** a desired appearance has a documented, licensed reference asset with meaningful maps or material data.
- **Decision rule:** inspect the reference asset under controlled views before authoring a procedural stand-in.
- **Mechanism:** map channels, units, light/view response, and artistic shortcuts become inspectable constraints rather than guesses.
- **Tradeoff:** acquisition, attribution, and fixture setup add deliberate friction; they reduce later false precision.
- **Failure mode:** treating the reference as a truth oracle, or copying its look while dropping its license/limits.
- **Test:** source commit and binary SHA-256 are recorded; neutral, grazing, and light-sweep receipts reveal a behavior difference; the material record retains non-claims.
- **Reversal trigger:** asset provenance/license cannot be pinned, or the asset's renderer assumptions make the comparison invalid.
- **Evidence:** `SRC-KHR-ABALONE-2026-10`, `SRC-KHR-IRIDESCENCE-2026-10`, `MVT-ABALONE-001`.
- **Confidence:** E2 for the source facts; E4 for the proposed adapter until executed.

## 2. Map semantics are not material semantics

- **Trigger:** two systems share labels such as “thickness,” “spectral,” “roughness,” or “iridescence.”
- **Decision rule:** translate only after recording channel, color space, unit, coordinate system, default, range, and renderer behavior.
- **Mechanism:** an explicit crosswalk exposes mismatches before a slider becomes a misleading universal control.
- **Tradeoff:** fewer seductive one-knob controls; more interpretable material records.
- **Failure mode:** treating `layerDepth`, `layerSpacing`, and nanometre film thickness as the same variable.
- **Test:** every adapter mapping declares source/target units and whether it is measured, fitted, or artistic; unproven mappings remain absent.
- **Reversal trigger:** an executed calibrated mapping can replace the “unproven” state for that narrow context.
- **Evidence:** `docs/case-studies/VMA-001/CONTROL_CROSSWALK.md`; `SRC-KHR-IRIDESCENCE-2026-10`; `SRC-THREE-PHYSICAL-2026-10`.
- **Confidence:** E2 for documented semantics; E4 for any future mapping.

## 3. Small optical kernel, original material grammar

- **Trigger:** a licensed source demonstrates a useful mathematical mechanism but not the desired material identity.
- **Decision rule:** adapt the minimum explainable kernel; author thickness fields, geometry, lighting, UI, and art direction independently.
- **Mechanism:** preserves attribution while preventing a whole-repository import from dictating unrelated architecture or appearance.
- **Tradeoff:** requires a comparison/control and explicit model boundary.
- **Failure mode:** importing a demo wholesale, then claiming its visual result validates an unrelated material.
- **Test:** adapted-file hash, declared source commit, compile receipt, and a falsifier tied to the copied mechanism.
- **Reversal trigger:** source's license, behavior, or complexity makes even the small kernel unsuitable.
- **Evidence:** `SRC-OVIEDO-BUBBLE-2026-10`, `MVT-BUBBLE-001`.
- **Confidence:** E2 for source identity/license; E4 until file-level inspection and execution.

## 4. Separate fidelity from presentation architecture

- **Trigger:** a high-fidelity renderer/helper is attractive but the existing gallery has a different runtime contract.
- **Decision rule:** use it as an isolated comparison lane until an explicit, measured need justifies dependency or renderer migration.
- **Mechanism:** protects the gallery's WebGL2 build/fallback/QA path while keeping a higher-fidelity reference available.
- **Tradeoff:** duplicate setup is intentional; it buys interpretable comparisons and reversible adoption.
- **Failure mode:** interpreting a path tracer or R3F helper as permission to replace the gallery stack.
- **Test:** reference-lane lockfile stays isolated, no global runtime dependency changes, and the trial receipt names the renderer/version/environment.
- **Reversal trigger:** a documented presentation requirement and measured evaluation show the current runtime cannot meet it.
- **Evidence:** `SRC-THREE-PHYSICAL-2026-10`, `SRC-OPENPBR-VIEWER-2026-10`, `SRC-DREI`, `SRC-REACT-POSTPROCESSING`.
- **Confidence:** E2 source facts; E4 architecture recommendation.

## 5. Three controlled views defeat the hero-image trap

- **Trigger:** a material's claim depends on view direction or lighting.
- **Decision rule:** require neutral, grazing, and light-sweep captures, each with camera/light/exposure/material state and artifact hash.
- **Mechanism:** makes an effect falsifiable across the conditions that should reveal it.
- **Tradeoff:** more capture work; fewer cinematic screenshots mistaken for material behavior.
- **Failure mode:** variable environment maps, exposure, or unrecorded camera movement manufacture apparent improvement.
- **Test:** receipt validator accepts only complete distinct captures and human review outcome; neutral control removes the claimed mechanism.
- **Reversal trigger:** a material is demonstrably view-independent, in which case replace—not waive—the fixture contract with a justified alternative.
- **Evidence:** Material Validation Lab validator and `MVT-ABALONE-001`, `MVT-BUBBLE-001`, `MVT-GOLD-001`.
- **Confidence:** E0 for validator behavior; E4 for an unexecuted material outcome.
