# Grain preview evidence

[Shader Gallery #44](https://github.com/MelodicBloom/shader-gallery/pull/44) provides the grain study, fixture lineage and Chromium acceptance suite. This follow-on adds a dependency-free Python verifier for the serving seam. It compares eight served resources to Git objects and exercises a missing module as a negative control. The checked-in port and its source remain where the grain comparison already manages them.

## Run

From the repository root with Git and Python 3.10+:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tools/verification -p test_grain_preview.py -v
python3 tools/verification/grain_preview.py --out /tmp/grain-route-local.json
```

For a named existing HTTPS preview, obtain its unique deployment URL and ID from the hosting dashboard. Record the provider's commit metadata alongside the receipt. A mounted Pages route needs the mount prefix in the base URL. Run each command with a fresh output path.

```sh
python3 tools/verification/grain_preview.py \
  --revision ef13a5a12b084e6f52e788fe96b194f021dfd9bd \
  --base-url "$REVIEWED_PREVIEW_URL" \
  --deployment-id "$REVIEWED_DEPLOYMENT_ID" \
  --out /tmp/grain-route-hosted.json
```

Use only a trusted preview URL supplied by the reviewer. The Python verifier uses anonymous GET requests and exits 2 for access blocks. Keep existing protection in place. If necessary, use the provider's authorized browser access for visual review and record that the anonymous automated check remains blocked. Treat a 3xx, an unexpected 404, different bytes, a wrong content type, or a soft 404 as evidence to investigate. A host that rewrites or optimizes the response body can intentionally fail this byte-level contract. Each request has an eight-second socket timeout. Elapsed times are observations for troubleshooting.

## Measurement contract

| Gate | Passing observation | Evidence |
| --- | --- | --- |
| Serving identity | Eight direct HTTP 200 responses with identical SHA-256 to the named Git revision and expected MIME where specified | Per-resource HTTP status, expected and observed digest, content type, bytes, and elapsed milliseconds |
| Missing route | Direct HTTP 404 for the synthetic missing module | Negative-control response in the same receipt |
| Browser behavior | Run the existing grain Chromium suite and use its named renderer and viewport evidence | [Original grain workflow](https://github.com/MelodicBloom/shader-gallery/actions/runs/42332084119) and a fresh deployment-specific browser receipt when available |
| Deployment binding | Unique deployment ID and provider metadata match the reviewed revision | Provider record linked by reviewer. The ID in Python JSON is reviewer-supplied |
| Art direction | Named reviewer records scale, contrast and material character at the default and one changed setting. Include device, viewport, browser, values and two captures | Reviewer decision of accept, revise, or defer, with one concrete observation per criterion |

Exit 0 means the serving contract passed. Exit 1 means at least one check failed. Exit 2 means an environment or input blocked execution or evidence. CI measures the checked-out revision on eligible PRs and preserves the receipt for 14 days. For PR runs the checkout may be GitHub's synthetic merge revision. For a long-lived decision, copy the required measurements and artifact hashes into the review record before retention expires.

## Agent handoff

- **Read.** Resolve PR #44 and its current head, then inspect the route's [provenance record](../../library-v1/ports/grain/provenance.json) and this handoff. Confirm the eight files and gate revision before running. If the head changed, record the old and new SHA and scope the rerun to the new head.
- **Measure.** Run the verifier and its controls. Preserve its JSON receipt and command exit. A positive HTTP result establishes identity for the eight resources. Record browser, real device, hardware GPU, and human evidence as distinct observations.
- **Interpret and draft.** For each comparison, record what a reviewer actually sees, which mechanism may account for it, and what evidence could disprove that explanation. If a revision is warranted, draft one parameter or algorithm change and one paired mockup using the same seed, viewport and capture point. Mark generated assets as candidates and record origin, recipe, rights and digest. Leave tuning and art direction decisions with the named reviewer.
- **Return.** Report repo, PR, full head and tested revision, deployment ID and commit metadata, exact commands and exit codes, receipt SHA-256, observations, residuals, and the next reviewer decision. Stop on drift, an access block, or an unresolved asset-rights question. Limit the run to verification and a draft recommendation. Publication, merge, lighting and glass are separate owner decisions.
- **Re-enter.** Use the last receipt and open gates as the starting point. The release reviewer can compare the same resource hashes across hosts without redoing provenance work, then devote review time to the two grain swatches and the smallest warranted change.
