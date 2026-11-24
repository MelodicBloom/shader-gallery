# EXP-001 evidence ledger — 2026-10-18

Provenance: bnsh_av tutorial https://www.youtube.com/watch?v=fSa0vZrXk9k ; description verified, detailed node graph unavailable. Browser and TouchDesigner algorithms are independently authored adaptations, not asset transfers.

Repository: MelodicBloom/shader-gallery. New additive branch; no stable gallery manifest edits. Tests are limited to deterministic CPU polar reference and contract. A live TouchDesigner trial, GPU browser visual capture, target-mobile 60 FPS and cross-device reproducibility have NOT been verified in this environment.

Acceptance sequence: unit test → browser compile/link/draw screenshot → fixed-time replay → reduced motion/controls → TouchDesigner Info DAT → median/p95 performance on named hardware → code review → promotion. Do not collapse evidence stages.

Known difference: Browser uses seeded 4-octave value fBm; TouchDesigner adapter samples an upstream Noise TOP and has no mathematical pixel parity expectation. Both use same polar wedge fold.

Next small trial: open browser route on an actual WebGL2-capable desktop, freeze t=1.2345/seed=314/512², test sectors 3/6/12/24, attach images and sampled error logs to PR.