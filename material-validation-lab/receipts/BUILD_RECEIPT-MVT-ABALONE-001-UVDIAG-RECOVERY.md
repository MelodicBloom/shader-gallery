# MVT-ABALONE-001 UV diagnostic recovery receipt

- **Recovery date:** 2026-11-12
- **Reason:** PR #31 review found that later `npm run trial` regeneration replaced `receipts/receipt.json` without carrying forward the label-inert `diagnostics` block produced by `npm run uvdiag`.
- **Authoritative source:** commit `f150e1889d2b39cb5604465e8f96a311333489e4`, path `material-validation-lab/reference/abalone/receipts/receipt.json`, property `diagnostics`.
- **Restored destination:** `material-validation-lab/reference/abalone/receipts/receipt.json`, property `diagnostics`.
- **Canonical JSON SHA-256:** `57642b0a31ed23902354efdc266d9f25079c1e329b4c8906b3f5bf4370811612` for both source and restored blocks.
- **Preserved state:** trial label `inconclusive`; review decision `pending`; seven historical run entries including run-3 `fail`; thresholds, captures, pins, attribution, and performance non-claim unchanged.
- **Forward guard:** `carryForwardDiagnostics` preserves the existing diagnostics block during complete receipt regeneration; its regression test compares the carried object and retains the new run history.
- **Failed-boot guard:** unsuccessful page boot now writes only an immutable receipt under `reference/abalone/receipts/runs/` and leaves the last complete `receipt.json` untouched.

This is recovery of previously committed measured evidence, not a new run, a new measurement, a pass decision, or hardware-GPU evidence.
