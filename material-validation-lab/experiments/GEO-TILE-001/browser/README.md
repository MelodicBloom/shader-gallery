# GEO-TILE browser inspector

This additive viewer uses the original Python generator unchanged. It displays four explicitly labeled parameter sets and their original map semantics/receipts. A Canvas2D light-direction control provides diagnostic relighting; it is not PBR, a mesh/importer validation, or a completed comparison trial.

From the repository root:

```sh
python3 material-validation-lab/experiments/GEO-TILE-001/browser/build.py
python3 -m http.server 4173
```

Open `/material-validation-lab/experiments/GEO-TILE-001/browser/`. Serve the repository root so the source/protocol link also resolves. Python runs at build time; the deployed viewer requires only static HTTPS hosting.

Rollback: remove this `browser/` directory; the generator and original trial remain intact.
