# Quality gates and evidence vocabulary

| Gate | Pass condition | Failure / blocked evidence |
|---|---|---|
| Source | Named author, URL, permission/license disposition, no unverified external asset in code | Unlicensed or missing provenance → blocked |
| Runtime | Python exits 0; generated PNG headers have correct dimensions/bit depth; maps sha256 listed | Exception, incorrect map metadata → fail |
| Determinism | Same seed+parameters yield identical hashes; changed seed changes at least one height hash | Any byte drift in fixed environment → fail |
| Structure | Tile parity is visibly meaningful; edge wear localized; no accidental UV seams | Symmetric pattern masks alternation; leaks across tiles → fail |
| Surface | Neutral/grazing/light-sweep captures under pinned geometry, light, exposure and renderer | No capture/version → inconclusive; broken import → blocked |
| Fidelity | Side-by-side comparative visual review against properly licensed and identified reference, with differences stated | Single hero frame is inadequate → inconclusive |
| Promotion | Explicit human approval and reviewed mapping to Shader Grammar authority | Never infer from screenshots or successful compile |

Status vocabulary: planned, pass, fail, blocked, inconclusive. Distinguish static synthetic map tests from actual GPU light-response validation. Do not claim 60 fps, measured BRDF, glTF material interchangeability or normal-Y orientation until separately verified.
