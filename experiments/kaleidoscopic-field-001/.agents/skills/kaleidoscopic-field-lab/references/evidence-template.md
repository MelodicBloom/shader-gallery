# Trial record template

Copy to `docs/evidence/KF-001/YYYYMMDD-trial-name.md`. Do not leave any unknown fact blank; use `not measured`, `not available`, or `blocked: <reason>`.

```markdown
# KF-001 trial: <descriptive id>
- UTC timestamp:
- Git repo, branch, full SHA:
- Hypothesis and controlled variable:
- Other held-constant variables:
- Environment (OS/browser/GPU/driver/DPR/canvas dimensions):
- Source fixture SHA-256 (WAV; JSON; schedule):
- Commands run and exact return statuses:
- Frame numbers, audio mode and parameters:
- Screenshot artifact names with hashes:
- JSON receipt artifact names with hashes:
- Observed difference versus flat reference:
- Reproduction/reset variance (same-runtime comparisons):
- Frame performance: method / p50 / p95 / drop fraction / data limitations:
- Shader compile/link status:
- TouchDesigner reconstruction status (optional):
- Source/license check:
- G0, G1, G2, G3, G4: PASS | FAIL | BLOCKED | NOT RUN:
- Competing explanations / confounds:
- What would falsify the interpretation:
- Decision: retain | modify | reject | promote for abstraction:
- Smallest next test and stopping condition:
```

Use a separate line per independent finding. Do not report a hypothesis as an observed result. Never mark an unrun gate PASS.
